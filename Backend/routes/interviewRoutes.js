import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  endInterview,
  getHistory,
  getInterview,
  startInterview,
  submitAnswer
} from '../controllers/interviewController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect);

router.post(
  '/start',
  [
    body('role').trim().notEmpty().withMessage('Role is required.'),
    body('experienceLevel').trim().notEmpty().withMessage('Experience level is required.'),
    body('difficulty').trim().notEmpty().withMessage('Difficulty is required.'),
    body('interviewType').trim().notEmpty().withMessage('Interview type is required.'),
    body('numberOfQuestions').isInt({ min: 1, max: 20 }).withMessage('Question count must be between 1 and 20.')
  ],
  validateRequest,
  startInterview
);

router.post(
  '/answer',
  [
    body('interviewId').isMongoId().withMessage('A valid interview ID is required.'),
    body('questionId').trim().notEmpty().withMessage('Question ID is required.'),
    body('transcript').trim().isLength({ min: 2 }).withMessage('Transcript is required.'),
    body('mode').optional().isIn(['voice', 'typing']).withMessage('Mode must be voice or typing.'),
    body('durationSeconds').optional().isNumeric().withMessage('Duration must be numeric.')
  ],
  validateRequest,
  submitAnswer
);

router.post(
  '/end',
  [
    body('interviewId').isMongoId().withMessage('A valid interview ID is required.'),
    body('elapsedSeconds').optional().isNumeric().withMessage('Elapsed seconds must be numeric.')
  ],
  validateRequest,
  endInterview
);

router.get('/history', getHistory);
router.get('/:id', [param('id').isMongoId().withMessage('A valid interview ID is required.')], validateRequest, getInterview);

export default router;
