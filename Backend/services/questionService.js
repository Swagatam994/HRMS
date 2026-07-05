import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../utils/AppError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const questionRoot = path.resolve(__dirname, '../questions');

const roleFileMap = {
  frontend: 'frontend.json',
  frontenddeveloper: 'frontend.json',
  react: 'frontend.json',
  backend: 'backend.json',
  backenddeveloper: 'backend.json',
  node: 'backend.json',
  nodejs: 'backend.json',
  hr: 'hr.json',
  humanresources: 'hr.json',
  behavioral: 'hr.json',
  javascript: 'javascript.json',
  js: 'javascript.json'
};

const normalize = (value = '') => value.toLowerCase().replace(/[^a-z0-9]/g, '');

const resolveFileName = (role) => {
  const normalized = normalize(role);
  if (roleFileMap[normalized]) return roleFileMap[normalized];

  const match = Object.entries(roleFileMap).find(([key]) => normalized.includes(key) || key.includes(normalized));
  return match?.[1] || `${normalized}.json`;
};

export const loadQuestionBank = async (role) => {
  const fileName = resolveFileName(role);
  const filePath = path.join(questionRoot, fileName);

  try {
    const file = await readFile(filePath, 'utf8');
    const bank = JSON.parse(file);
    return {
      role: bank.role || role,
      questions: (bank.questions || []).map((question, index) => ({
        id: String(question.id || index + 1),
        question: question.question,
        answer: question.answer || '',
        difficulty: question.difficulty || 'Intermediate',
        type: question.type || 'Technical',
        tags: question.tags || []
      }))
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new AppError(`No local question bank found for role "${role}".`, 404);
    }
    throw error;
  }
};

export const getQuestionsByRole = async (role, filters = {}) => {
  const bank = await loadQuestionBank(role);
  const difficulty = filters.difficulty;
  const interviewType = filters.interviewType || filters.type;
  const limit = Math.max(1, Math.min(Number(filters.limit || filters.numberOfQuestions || 10), 20));

  const filtered = bank.questions.filter((question) => {
    const difficultyMatches =
      !difficulty ||
      difficulty === 'Mixed' ||
      question.difficulty.toLowerCase() === String(difficulty).toLowerCase();
    const typeMatches =
      !interviewType ||
      interviewType === 'Mixed' ||
      question.type.toLowerCase() === String(interviewType).toLowerCase() ||
      question.type === 'Mixed';

    return difficultyMatches && typeMatches;
  });

  const selectedIds = new Set(filtered.map((question) => question.id));
  const topUpQuestions = bank.questions.filter((question) => !selectedIds.has(question.id));
  const selected = filtered.length ? [...filtered, ...topUpQuestions] : bank.questions;

  return {
    role: bank.role,
    questions: selected.slice(0, limit),
    total: selected.length
  };
};
