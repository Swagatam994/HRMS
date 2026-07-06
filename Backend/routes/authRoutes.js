import { Router } from 'express';
import { body } from 'express-validator';
import { login, register } from '../controllers/authController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
    body('role').optional().isIn(['recruiter', 'candidate']).withMessage('Role must be recruiter or candidate.'),
    body('organization').optional().trim().isLength({ max: 120 }).withMessage('Organization is too long.')
  ],
  validateRequest,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.')
  ],
  validateRequest,
  login
);

export default router;
