import express from 'express';
import { startOnboarding, getTasksForEmployee, updateTask, createTask, deleteTask } from '../controllers/onboardingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/start', protect, startOnboarding);
router.post('/tasks', protect, createTask);
router.get('/tasks/:employeeId', protect, getTasksForEmployee);
router.put('/tasks/:taskId', protect, updateTask);
router.delete('/tasks/:taskId', protect, deleteTask);

export default router;
