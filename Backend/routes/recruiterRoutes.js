import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createInterview,
  getDashboard,
  getInterview,
  getRankings,
  getSession,
  listInterviews,
  updateCandidateStatus,
  updateInterview
} from '../controllers/recruiterController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect, authorizeRoles('recruiter'));

router.get('/dashboard', getDashboard);
router.get('/interviews', listInterviews);
router.post(
  '/interviews',
  [
    body('title').optional().trim().isLength({ max: 140 }).withMessage('Title is too long.'),
    body('role').trim().notEmpty().withMessage('Role is required.'),
    body('experienceLevel').trim().notEmpty().withMessage('Experience level is required.'),
    body('difficulty').trim().notEmpty().withMessage('Difficulty is required.'),
    body('interviewType').trim().notEmpty().withMessage('Interview type is required.'),
    body('numberOfQuestions').isInt({ min: 1, max: 20 }).withMessage('Question count must be between 1 and 20.'),
    body('scoringCriteria.strongHireScore').optional().isFloat({ min: 0, max: 10 }),
    body('scoringCriteria.hireScore').optional().isFloat({ min: 0, max: 10 }),
    body('scoringCriteria.considerScore').optional().isFloat({ min: 0, max: 10 }),
    body('settings.allowVoice').optional().isBoolean(),
    body('settings.allowText').optional().isBoolean(),
    body('settings.showEvaluationToCandidate').optional().isBoolean(),
    body('settings.autoShortlist').optional().isBoolean()
  ],
  validateRequest,
  createInterview
);

router.get(
  '/interviews/:id',
  [param('id').isMongoId().withMessage('A valid interview ID is required.')],
  validateRequest,
  getInterview
);
router.patch(
  '/interviews/:id',
  [
    param('id').isMongoId().withMessage('A valid interview ID is required.'),
    body('status').optional().isIn(['draft', 'open', 'closed', 'completed']).withMessage('Invalid status.')
  ],
  validateRequest,
  updateInterview
);
router.get(
  '/interviews/:id/rankings',
  [param('id').isMongoId().withMessage('A valid interview ID is required.')],
  validateRequest,
  getRankings
);
router.get(
  '/sessions/:sessionId',
  [param('sessionId').isMongoId().withMessage('A valid session ID is required.')],
  validateRequest,
  getSession
);
router.patch(
  '/rankings/:rankingId/status',
  [
    param('rankingId').isMongoId().withMessage('A valid ranking ID is required.'),
    body('status').isIn(['Pending', 'Shortlisted', 'Rejected', 'On Hold']).withMessage('Invalid candidate status.')
  ],
  validateRequest,
  updateCandidateStatus
);

export default router;
