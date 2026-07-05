import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { buildEvaluationPrompt, evaluationResponseSchema } from '../prompts/evaluationPrompt.js';
import { buildSummaryPrompt, summaryResponseSchema } from '../prompts/summaryPrompt.js';
import { parseJsonFromText } from '../utils/parseJson.js';
import { average, buildReportFromAnswers, clampScore } from '../utils/reportUtils.js';

const ai = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

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

const generateJson = async ({ input, schema, systemInstruction }) => {
  if (!ai) {
    throw new Error('Gemini client is not configured.');
  }

  if (ai.interactions?.create) {
    const interaction = await ai.interactions.create({
      model: env.geminiModel,
      input,
      system_instruction: systemInstruction,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema
      },
      generation_config: {
        temperature: 0.2,
        thinking_level: 'low'
      }
    });
    return parseJsonFromText(interaction.output_text);
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

  return parseJsonFromText(response.text || response.response?.text?.() || '');
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
