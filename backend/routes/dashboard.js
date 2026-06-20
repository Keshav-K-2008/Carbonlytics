import express from 'express';
import { protect } from '../middleware/auth.js';
import { getDashboardData, exportReportPDF } from '../controllers/dashboardController.js';

const router = express.Router();

router.use(protect); // Secure dashboard routes

router.get('/', getDashboardData);
router.get('/export-pdf', exportReportPDF);

export default router;
