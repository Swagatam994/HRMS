import { Router } from 'express';
import {
  getAttendance,
  getHiring,
  getLeaves,
  getOverview,
  getPayroll,
  getProductivity,
  getWorkforceReport
} from '../controllers/dashboardController.js';
import { authorizeRoles, protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect, authorizeRoles('recruiter'));

router.get('/overview', getOverview);
router.get('/hiring', getHiring);
router.get('/productivity', getProductivity);
router.get('/payroll', getPayroll);
router.get('/attendance', getAttendance);
router.get('/leaves', getLeaves);
router.get('/workforce-report', getWorkforceReport);

export default router;
