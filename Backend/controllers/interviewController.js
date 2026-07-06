import { Interview } from '../models/Interview.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getQuestionsByRole } from '../services/questionService.js';
import { evaluateAnswer, generateInterviewSummary } from '../services/geminiService.js';

const serializeQuestion = (question) => {
  if (!question) return null;
  return {
    id: question.id,
    question: question.question,
    difficulty: question.difficulty,
    type: question.type,
    tags: question.tags || []
  };
};

const summarizeInterview = (interview) => ({
  id: interview._id,
  role: interview.role,
  experienceLevel: interview.experienceLevel,
  difficulty: interview.difficulty,
  interviewType: interview.interviewType,
  numberOfQuestions: interview.numberOfQuestions,
  status: interview.status,
  answeredCount: interview.answers?.length || 0,
  overallScore: interview.finalReport?.overallScore || 0,
  startedAt: interview.startedAt,
  endedAt: interview.endedAt,
  createdAt: interview.createdAt
});

const makeInviteCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const createInviteCode = async () => {
  for (let index = 0; index < 8; index += 1) {
    const inviteCode = makeInviteCode();
    const exists = await Interview.exists({ inviteCode });
    if (!exists) return inviteCode;
  }
  throw new AppError('Unable to generate a unique invite code.', 500);
};

export const startInterview = asyncHandler(async (req, res) => {
  const { title, role, experienceLevel, difficulty, numberOfQuestions, interviewType } = req.body;
  const bank = await getQuestionsByRole(role, {
    difficulty,
    interviewType,
    numberOfQuestions
  });

  if (!bank.questions.length) {
    throw new AppError('No questions available for the selected interview setup.', 404);
  }

  const interview = await Interview.create({
    recruiter: req.user._id,
    title: title || `${bank.role} Interview`,
    role: bank.role,
    experienceLevel,
    difficulty,
    interviewType,
    numberOfQuestions: bank.questions.length,
    questionSet: bank.questions,
    inviteCode: await createInviteCode(),
    status: 'open'
  });

  res.status(201).json({
    interview: {
      id: String(interview._id),
      _id: String(interview._id),
      title: interview.title,
      role: interview.role,
      experienceLevel: interview.experienceLevel,
      difficulty: interview.difficulty,
      interviewType: interview.interviewType,
      numberOfQuestions: interview.numberOfQuestions,
      status: interview.status,
      inviteCode: interview.inviteCode,
      createdAt: interview.createdAt
    }
  });
});

export const submitAnswer = asyncHandler(async (req, res) => {
  const { interviewId, questionId, transcript, mode = 'voice', durationSeconds = 0 } = req.body;
  const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  if (!['in_progress', 'paused'].includes(interview.status)) {
    throw new AppError('This interview is not accepting answers.', 409);
  }

  const question =
    interview.questions.find((item) => item.id === String(questionId)) ||
    interview.questions[interview.currentQuestionIndex];

  if (!question) {
    throw new AppError('Question not found for this interview.', 404);
  }

  const feedback = await evaluateAnswer({
    role: interview.role,
    experienceLevel: interview.experienceLevel,
    difficulty: question.difficulty || interview.difficulty,
    question: question.question,
    expectedAnswer: question.answer,
    transcript
  });

  const answerPayload = {
    questionId: question.id,
    question: question.question,
    expectedAnswer: question.answer,
    transcript,
    mode,
    durationSeconds,
    feedback,
    evaluatedAt: new Date()
  };

  const existingIndex = interview.answers.findIndex((answer) => answer.questionId === question.id);
  if (existingIndex >= 0) {
    interview.answers.set(existingIndex, answerPayload);
  } else {
    interview.answers.push(answerPayload);
  }

  interview.status = 'in_progress';
  interview.currentQuestionIndex = Math.min(interview.answers.length, interview.questions.length);
  await interview.save();

  const nextQuestion = interview.questions[interview.currentQuestionIndex];

  res.json({
    answer: interview.answers.find((answer) => answer.questionId === question.id),
    nextQuestion: serializeQuestion(nextQuestion),
    isComplete: interview.answers.length >= interview.questions.length,
    interview: summarizeInterview(interview)
  });
});

export const endInterview = asyncHandler(async (req, res) => {
  const { interviewId, elapsedSeconds } = req.body;
  const interview = await Interview.findOne({ _id: interviewId, user: req.user._id });

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  const report = await generateInterviewSummary(interview);
  interview.finalReport = report;
  interview.status = 'completed';
  interview.endedAt = new Date();
  interview.elapsedSeconds = elapsedSeconds ?? interview.elapsedSeconds;
  await interview.save();

  res.json({
    interview,
    report
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const interviews = await Interview.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .select('role experienceLevel difficulty interviewType status numberOfQuestions answers finalReport startedAt endedAt createdAt')
    .lean();

  res.json({
    interviews: interviews.map((interview) => ({
      ...interview,
      answeredCount: interview.answers?.length || 0
    }))
  });
});

export const getInterview = asyncHandler(async (req, res) => {
  const interview = await Interview.findOne({ _id: req.params.id, user: req.user._id });

  if (!interview) {
    throw new AppError('Interview not found.', 404);
  }

  res.json({ interview });
});
