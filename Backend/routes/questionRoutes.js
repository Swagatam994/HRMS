import { Router } from 'express';
import { getQuestions } from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/:role', protect, getQuestions);

export default router;
