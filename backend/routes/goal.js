import express from 'express';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createGoal, getGoals, deleteGoal, goalSchema } from '../controllers/goalController.js';

const router = express.Router();

router.use(protect); // Secure these routes

router.route('/')
  .post(validateBody(goalSchema), createGoal)
  .get(getGoals);

router.route('/:id')
  .delete(deleteGoal);

export default router;
