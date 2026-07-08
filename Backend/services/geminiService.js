import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import Employee from '../models/Employee.js';
import HRPolicy from '../models/HRPolicy.js';
import LeaveRequest from '../models/LeaveRequest.js';
import PayrollRecord from '../models/PayrollRecord.js';
import OnboardingSession from '../models/OnboardingSession.js';
import { buildEvaluationPrompt, evaluationResponseSchema } from '../prompts/evaluationPrompt.js';
import { buildSummaryPrompt, summaryResponseSchema } from '../prompts/summaryPrompt.js';
import { buildResumePrompt, resumeResponseSchema } from '../prompts/resumePrompt.js';
import { parseJsonFromText } from '../utils/parseJson.js';
import { average, buildReportFromAnswers, clampScore } from '../utils/reportUtils.js';

const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

const SUPPORT_SYSTEM_PROMPT = `You are a friendly, professional HR assistant. Use only the context supplied to you. If the context does not contain enough information to answer the question, reply exactly: I don't have that information right now, please contact human resources. If the user asks a question that is not related to HR, company policies, leave, payroll, onboarding, or company processes, politely decline and remind them that you are an HR assistant.`;

const ensureArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
};

const normalizeWords = (text = '') => {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'is', 'are', 'for', 'with', 'that']);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));
};

const fallbackEvaluation = ({ expectedAnswer, transcript, difficulty }) => {
  const expectedWords = [...new Set(normalizeWords(expectedAnswer))];
  const transcriptWords = new Set(normalizeWords(transcript));
  const matched = expectedWords.filter((word) => transcriptWords.has(word)).length;
  const coverage = expectedWords.length ? matched / Math.min(expectedWords.length, 14) : 0.45;
  const answerLength = normalizeWords(transcript).length;
  const fillerPenalty = /\b(um|uh|maybe|i guess|not sure)\b/i.test(transcript) ? 1 : 0;

  const technicalAccuracy = clampScore(3 + coverage * 7);
  const communication = clampScore(Math.min(9, 4 + answerLength / 18) - fillerPenalty);
  const completeness = clampScore(2.5 + Math.min(answerLength / 12, 1) * 3 + coverage * 4);
  const confidence = clampScore(Math.min(9, 4 + answerLength / 22) - fillerPenalty);
  const overall = average([technicalAccuracy, communication, completeness, confidence]);

  return {
    score: { technicalAccuracy, communication, completeness, confidence, overall },
    idealAnswer: expectedAnswer || 'A complete answer should directly address the question with accurate examples.',
    mistakes:
      overall >= 7
        ? []
        : ['The answer needs more precise detail and stronger coverage of the expected concepts.'],
    suggestions: [
      'Structure the response with a short definition, one concrete example, and a trade-off or use case.',
      'Use specific terminology from the question to make the answer easier to evaluate.'
    ],
    strengths:
      answerLength > 18
        ? ['Provided a meaningful response with enough context to evaluate.']
        : ['Kept the response concise.'],
    weaknesses:
      overall >= 7
        ? ['Could still improve with sharper examples.']
        : ['Missed important expected concepts or did not explain them fully.'],
    recommendedTopics: ['Core concepts', 'Practical examples', 'Interview communication'],
    difficultyLevel: difficulty || 'Intermediate',
    raw: { source: 'local-fallback' }
  };
};

const normalizeEvaluation = (data, fallbackInput) => {
  const score = data?.score || {};
  return {
    score: {
      technicalAccuracy: clampScore(score.technicalAccuracy),
      communication: clampScore(score.communication),
      completeness: clampScore(score.completeness),
      confidence: clampScore(score.confidence),
      overall: clampScore(score.overall)
    },
    idealAnswer: String(data?.idealAnswer || fallbackInput.expectedAnswer || ''),
    mistakes: ensureArray(data?.mistakes),
    suggestions: ensureArray(data?.suggestions),
    strengths: ensureArray(data?.strengths),
    weaknesses: ensureArray(data?.weaknesses),
    recommendedTopics: ensureArray(data?.recommendedTopics),
    difficultyLevel: String(data?.difficultyLevel || fallbackInput.difficulty || 'Intermediate'),
    raw: data
  };
};

const normalizeSummary = (data, answers) => ({
  overallScore: clampScore(data?.overallScore ?? average(answers.map((answer) => answer.feedback?.score?.overall || 0))),
  summary: String(data?.summary || buildReportFromAnswers(answers).summary),
  strengths: ensureArray(data?.strengths).slice(0, 8),
  weaknesses: ensureArray(data?.weaknesses).slice(0, 8),
  recommendedTopics: ensureArray(data?.recommendedTopics).slice(0, 10),
  generatedAt: new Date()
});

const extractTextFromResponse = (response) => {
  if (typeof response?.text === 'string' && response.text.trim()) {
    return response.text;
  }

  if (typeof response?.response?.text === 'function') {
    const text = response.response.text();
    if (typeof text === 'string' && text.trim()) return text;
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const combined = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .filter(Boolean)
      .join('');
    if (combined.trim()) return combined;
  }

  return '';
};

const generateJson = async ({ input, schema, systemInstruction }) => {
  if (!ai) {
    throw new Error('Gemini client is not configured.');
  }

  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: input,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: schema,
      temperature: 0.2
    }
  });

  return parseJsonFromText(extractTextFromResponse(response));
};

const detectSupportIntent = (message = '') => {
  const text = String(message).toLowerCase();

  if (/leave|days left|leave request|leave balance|sick|vacation|holiday/i.test(text)) return 'leave';
  if (/salary|payroll|payslip|bonus|deduction|net salary/i.test(text)) return 'payroll';
  if (/onboarding|pending task|first day|first-day|document|team|manager|it setup|it setup|checklist/i.test(text)) return 'onboarding';
  if (/policy|attendance|working hours|working-hours|holiday|code of conduct|remote work|work from home|policy/i.test(text)) return 'policy';
  if (/how do i|how can i|step|process|apply|download|update profile|contact hr|view attendance/i.test(text)) return 'process';

  return 'out_of_scope';
};

const buildSupportContext = async ({ employeeId, userMessage }) => {
  const employee = employeeId ? await Employee.findById(employeeId).lean() : null;
  const intent = detectSupportIntent(userMessage);
  const context = {
    intent,
    employee: employee || null,
    policies: [],
    leaveRequests: [],
    payrollRecords: [],
    onboardingSession: null,
    pendingTasks: [],
    processGuidance: [
      'To apply for leave, open the HR or leave section in the portal and submit a new leave request.',
      'To download a payslip, open the payroll section and select the latest payslip for download.',
      'To complete onboarding, open the onboarding tasks page and finish each assigned checklist item.'
    ]
  };

  if (!employee) return context;

  if (intent === 'policy') {
    const policies = await HRPolicy.find({ active: true }).sort({ createdAt: -1 }).limit(10).lean();
    const keywords = String(userMessage).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    context.policies = policies.filter((policy) => {
      const haystack = `${policy.title || ''} ${policy.category || ''} ${policy.content || ''}`.toLowerCase();
      return keywords.some((keyword) => haystack.includes(keyword));
    });
  }

  if (intent === 'leave') {
    const leaveRequests = await LeaveRequest.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(10).lean();
    const approvedDays = leaveRequests.filter((request) => request.status === 'approved').reduce((acc, request) => acc + Number(request.days || 0), 0);
    const remainingDays = Math.max(20 - approvedDays, 0);
    context.leaveRequests = leaveRequests;
    context.leaveSummary = `Remaining leave days: ${remainingDays}. Recent requests: ${leaveRequests.length || 0}.`;
  }

  if (intent === 'payroll') {
    const payrollRecords = await PayrollRecord.find({ employee: employee._id }).sort({ createdAt: -1 }).limit(5).lean();
    context.payrollRecords = payrollRecords;
    context.payrollSummary = payrollRecords[0]
      ? `Latest payroll record: month ${payrollRecords[0].month || 'N/A'} with net salary ${payrollRecords[0].netSalary || 0}, bonus ${payrollRecords[0].bonus || 0}, and deductions ${payrollRecords[0].deductions || 0}.`
      : 'No payroll records found.';
  }

  if (intent === 'onboarding') {
    const onboardingSession = await OnboardingSession.findOne({ employee: employee._id }).populate('tasks').lean();
    const pendingTasks = (onboardingSession?.tasks || []).filter((task) => task?.status !== 'completed');
    context.onboardingSession = onboardingSession;
    context.pendingTasks = pendingTasks;
    context.onboardingSummary = onboardingSession
      ? `Onboarding status: ${onboardingSession.status || 'pending'}; pending tasks: ${pendingTasks.length}.`
      : 'No onboarding session found.';
  }

  if (intent === 'process') {
    context.processGuidance = [
      'To apply for leave, use the leave request feature and submit your dates and reason.',
      'To view attendance, open your profile or attendance section in the portal.',
      'To download a payslip, go to payroll and select the latest payslip.',
      'To update personal details, open your profile and edit the information you want to change.'
    ];
  }

  return context;
};

const buildSupportPrompt = ({ context, userMessage }) => {
  const employeeLine = context.employee ? `Employee: ${context.employee.name || 'Unknown'} (${context.employee.role || 'Employee'})` : 'Employee: Not found';
  const policyLine = context.policies.length
    ? context.policies.map((policy) => `- ${policy.title}: ${policy.content}`).join('\n')
    : 'No matching policy documents were found.';
  const leaveLine = context.leaveSummary || 'No leave context available.';
  const payrollLine = context.payrollSummary || 'No payroll context available.';
  const onboardingLine = context.onboardingSummary || 'No onboarding context available.';
  const processLine = (context.processGuidance || []).join('\n');

  return `
${SUPPORT_SYSTEM_PROMPT}

Intent: ${context.intent}
${employeeLine}

Relevant policy context:
${policyLine}

Leave context:
${leaveLine}

Payroll context:
${payrollLine}

Onboarding context:
${onboardingLine}

Process guidance:
${processLine}

User message:
${userMessage}
`;
};

export const generateSupportResponse = async (employeeId, userMessage) => {
  const context = await buildSupportContext({ employeeId, userMessage });

  if (context.intent === 'out_of_scope') {
    return {
      text: 'I can help with HR-related questions about policies, leave, payroll, onboarding, and company processes. Please ask me something related to those topics.',
      intent: context.intent,
      context
    };
  }

  if (!env.geminiApiKey) {
    return {
      text: `I can help with this HR topic. Based on the available context, ${context.leaveSummary || context.payrollSummary || context.onboardingSummary || 'I do not have any matching records yet.'}`,
      intent: context.intent,
      context
    };
  }

  try {
    const prompt = buildSupportPrompt({ context, userMessage });
    const response = await ai.models.generateContent({
      model: env.geminiModel,
      contents: prompt,
      config: {
        temperature: 0.2,
        maxOutputTokens: 400
      }
    });

    const text = extractTextFromResponse(response) || "I don't have that information right now, please contact human resources.";

    return { text, intent: context.intent, context };
  } catch (error) {
    console.warn('Gemini support response failed. Using fallback guidance.', error.message);
    return {
      text: 'I don\'t have that information right now, please contact human resources.',
      intent: context.intent,
      context
    };
  }
};

export const evaluateAnswer = async (input) => {
  if (!env.geminiApiKey) {
    return fallbackEvaluation(input);
  }

  try {
    const prompt = buildEvaluationPrompt(input);
    const result = await generateJson({
      input: prompt,
      schema: evaluationResponseSchema,
      systemInstruction: 'You are a strict but fair technical interviewer. Return valid JSON only.'
    });

    return normalizeEvaluation(result, input);
  } catch (error) {
    console.warn('Gemini evaluation failed. Using local fallback:', error.message);
    return fallbackEvaluation(input);
  }
};

export const generateInterviewSummary = async (interview) => {
  const answers = interview.answers || [];

  if (!env.geminiApiKey) {
    return buildReportFromAnswers(answers);
  }

  try {
    const result = await generateJson({
      input: buildSummaryPrompt({ interview, answers }),
      schema: summaryResponseSchema,
      systemInstruction: 'You are an interview coach. Return a concise JSON report only.'
    });

    return normalizeSummary(result, answers);
  } catch (error) {
    console.warn('Gemini summary failed. Using local report:', error.message);
    return buildReportFromAnswers(answers);
  }
};

export const parseResume = async ({ resumeText, jobDescription }) => {
  if (!env.geminiApiKey) {
    return {
      name: null,
      email: null,
      totalYearsOfExperience: null,
      coreTechnicalSkills: [],
      highestEducationLevel: null,
      matches: [],
      missingKeyRequirements: [],
      match_score: 0,
      status: 'Parsing Failed - No API Key'
    };
  }

  try {
    const prompt = buildResumePrompt({ resumeText, jobDescription });
    const result = await generateJson({
      input: prompt,
      schema: resumeResponseSchema,
      systemInstruction: 'You are the Resume Intelligence & Screening Agent. Return valid JSON only based on the schema.'
    });

    return result;
  } catch (error) {
    console.error('Gemini resume parsing failed:', error.message);
    return {
      match_score: 0,
      status: 'Parsing Failed'
    };
  }
};
