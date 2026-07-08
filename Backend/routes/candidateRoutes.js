import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  completeSession,
  getDashboard,
  getInvite,
  getSession,
  joinByCode,
  startSession,
  submitAnswer
} from '../controllers/candidateController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect, authorizeRoles('candidate'));

router.get('/dashboard', getDashboard);
router.get(
  '/invite/:code',
  [param('code').trim().isLength({ min: 4 }).withMessage('Invite code is required.')],
  validateRequest,
  getInvite
);
router.post(
  '/join',
  [body('inviteCode').trim().isLength({ min: 4 }).withMessage('Invite code is required.')],
  validateRequest,
  joinByCode
);
router.get(
  '/interviews/:sessionId',
  [param('sessionId').isMongoId().withMessage('A valid session ID is required.')],
  validateRequest,
  getSession
);
router.post(
  '/interviews/:sessionId/start',
  [param('sessionId').isMongoId().withMessage('A valid session ID is required.')],
  validateRequest,
  startSession
);
router.post(
  '/interviews/:sessionId/answer',
  [
    param('sessionId').isMongoId().withMessage('A valid session ID is required.'),
    body('transcript').trim().isLength({ min: 2 }).withMessage('Transcript is required.'),
    body('mode').optional().isIn(['voice', 'typing', 'text']).withMessage('Mode must be voice or text.'),
    body('durationSeconds').optional().isNumeric().withMessage('Duration must be numeric.'),
    body('elapsedSeconds').optional().isNumeric().withMessage('Elapsed seconds must be numeric.')
  ],
  validateRequest,
  submitAnswer
);
router.post(
  '/interviews/:sessionId/complete',
  [
    param('sessionId').isMongoId().withMessage('A valid session ID is required.'),
    body('elapsedSeconds').optional().isNumeric().withMessage('Elapsed seconds must be numeric.')
  ],
  validateRequest,
  completeSession
);

export default router;
