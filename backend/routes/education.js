import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getArticles,
  getBookmarked,
  getArticle,
  toggleBookmark,
} from '../controllers/educationController.js';

const router = express.Router();

router.use(protect);

router.get('/', getArticles);
router.get('/bookmarks', getBookmarked);
router.get('/:id', getArticle);
router.post('/:id/bookmark', toggleBookmark);

export default router;
