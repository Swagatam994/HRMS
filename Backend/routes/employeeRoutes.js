import express from 'express';
import { createEmployeeFromCandidate, getEmployee } from '../controllers/employeeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create', protect, createEmployeeFromCandidate);
router.get('/:id', protect, getEmployee);

export default router;
