import express from 'express';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import {
  chatWithSupport,
  createSupportPolicy,
  deleteSupportPolicy,
  getSupportHistory,
  listSupportPolicies,
  updateSupportPolicy
} from '../controllers/supportController.js';

const router = express.Router();

router.post('/chat', protect, chatWithSupport);
router.get('/history/:employeeId?', protect, getSupportHistory);
router.get('/policies', protect, listSupportPolicies);
router.post('/policies', protect, authorizeRoles('recruiter'), createSupportPolicy);
router.put('/policies/:id', protect, authorizeRoles('recruiter'), updateSupportPolicy);
router.delete('/policies/:id', protect, authorizeRoles('recruiter'), deleteSupportPolicy);

export default router;
