import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  requestPasswordReset,
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../controllers/authController.js';

const router = express.Router();

// Rate limiters for security
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register request attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateBody(registerSchema), register);
router.post('/login', authLimiter, validateBody(loginSchema), login);
router.post('/forgot-password', authLimiter, requestPasswordReset);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, validateBody(updateProfileSchema), updateProfile);

export default router;
