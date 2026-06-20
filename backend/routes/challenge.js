import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getChallenges,
  enrollInChallenge,
  updateChallengeProgress,
} from '../controllers/challengeController.js';

const router = express.Router();

router.use(protect); // Ensure all routes are protected

router.get('/', getChallenges);
router.post('/:id/enroll', enrollInChallenge);
router.put('/:id/progress', updateChallengeProgress);

export default router;
