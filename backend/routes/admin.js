import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  getAdminStats,
  adminCreateChallenge,
  adminPublishArticle,
  createChallengeSchema,
  publishArticleSchema,
} from '../controllers/adminController.js';

const router = express.Router();

// Enforce admin-only access
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getAdminStats);
router.post('/challenges', validateBody(createChallengeSchema), adminCreateChallenge);
router.post('/articles', validateBody(publishArticleSchema), adminPublishArticle);

export default router;
