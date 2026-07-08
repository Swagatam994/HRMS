import express from 'express';
import { postChat, getChatHistory } from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/onboarding', protect, postChat);
router.get('/history/:employeeId', protect, getChatHistory);

export default router;
