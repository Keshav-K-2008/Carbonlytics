import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  logActivity,
  getActivities,
  deleteActivity,
  getFactors,
  logActivitySchema,
} from '../controllers/activityController.js';

const router = express.Router();

router.use(protect); // Ensure all activity routes are authenticated

router.route('/')
  .post(validateBody(logActivitySchema), logActivity)
  .get(getActivities);

router.route('/factors')
  .get(getFactors);

router.route('/:id')
  .delete(deleteActivity);

export default router;
