import { asyncHandler } from '../utils/asyncHandler.js';
import { getQuestionsByRole } from '../services/questionService.js';

export const getQuestions = asyncHandler(async (req, res) => {
  const { role } = req.params;
  const bank = await getQuestionsByRole(role, req.query);
  res.json(bank);
});
