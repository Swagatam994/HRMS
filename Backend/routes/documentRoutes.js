import express from 'express';
import { generateDocument, getDocumentsForEmployee } from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate', protect, generateDocument);
router.get('/:employeeId', protect, getDocumentsForEmployee);

export default router;
