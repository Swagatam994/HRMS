import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect);

router.get('/profile', getProfile);
router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters.'),
    body('title').optional().trim().isLength({ max: 80 }).withMessage('Title is too long.'),
    body('organization').optional().trim().isLength({ max: 120 }).withMessage('Organization is too long.'),
    body('location').optional().trim().isLength({ max: 80 }).withMessage('Location is too long.'),
    body('bio').optional().trim().isLength({ max: 500 }).withMessage('Bio is too long.'),
    body('avatarUrl').optional({ checkFalsy: true }).trim().isURL().withMessage('Avatar URL must be valid.')
  ],
  validateRequest,
  updateProfile
);

export default router;
