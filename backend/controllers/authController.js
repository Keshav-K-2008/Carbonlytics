import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { query } from '../config/db.js';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_carbon_footprint_jwt_key_998877';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// Validation Schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  avatarUrl: z.string().url().optional().or(z.string().length(0)),
  dailyEmissionTarget: z.number().min(0.1).optional(),
  monthlyEmissionTarget: z.number().min(1).optional(),
  preferences: z.object({
    notifications: z.boolean().optional(),
    theme: z.enum(['light', 'dark']).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
});

export const register = async (req, res) => {
  const { email, password, fullName } = req.body;

  try {
    // Check if user already exists
    const userExists = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userExists.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create User
    const userId = crypto.randomUUID();
    await query(
      'INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [userId, email.toLowerCase(), passwordHash, 'user']
    );

    // Create Profile
    await query(
      `INSERT INTO profiles (id, full_name, total_points, current_streak, highest_streak, current_level) 
       VALUES ($1, $2, 0, 0, 0, 'Beginner')`,
      [userId, fullName]
    );

    // Seed initial onboarding notifications
    await query(
      'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
      [
        crypto.randomUUID(),
        userId,
        'Welcome to Carbonlytix!',
        'Start tracking and reducing your carbon footprint today. Use the calculator to log your first activity!',
        'system'
      ]
    );

    // Generate JWT
    const token = jwt.sign({ id: userId, role: 'user' }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        email,
        role: 'user',
        fullName,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.',
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find User
    const userRes = await query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password or email is incorrect.',
      });
    }

    const user = userRes.rows[0];

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password or email is incorrect.',
      });
    }

    // Fetch Profile
    const profileRes = await query('SELECT full_name, avatar_url FROM profiles WHERE id = $1', [user.id]);
    const profile = profileRes.rows[0];

    // Generate JWT
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: profile?.full_name || '',
        avatarUrl: profile?.avatar_url || '',
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profileRes = await query(
      `SELECT u.email, u.role, p.* 
       FROM users u 
       JOIN profiles p ON u.id = p.id 
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (profileRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const data = profileRes.rows[0];
    
    // Parse preferences JSON if it returned as string in SQLite
    if (typeof data.preferences === 'string') {
      data.preferences = JSON.parse(data.preferences);
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile information.',
    });
  }
};

export const updateProfile = async (req, res) => {
  const { fullName, avatarUrl, dailyEmissionTarget, monthlyEmissionTarget, preferences } = req.body;
  const userId = req.user.id;

  try {
    // Build update parameters dynamically
    // In SQLite, it's easier to retrieve, merge, and overwrite, or update individual fields
    const currentRes = await query('SELECT full_name, avatar_url, daily_emission_target, monthly_emission_target, preferences FROM profiles WHERE id = $1', [userId]);
    if (currentRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const current = currentRes.rows[0];
    let curPref = current.preferences;
    if (typeof curPref === 'string') curPref = JSON.parse(curPref);

    const mergedFullName = fullName !== undefined ? fullName : current.full_name;
    const mergedAvatar = avatarUrl !== undefined ? avatarUrl : current.avatar_url;
    const mergedDaily = dailyEmissionTarget !== undefined ? dailyEmissionTarget : current.daily_emission_target;
    const mergedMonthly = monthlyEmissionTarget !== undefined ? monthlyEmissionTarget : current.monthly_emission_target;
    
    let mergedPref = curPref;
    if (preferences !== undefined) {
      mergedPref = { ...curPref, ...preferences };
    }

    const prefString = JSON.stringify(mergedPref);

    await query(
      `UPDATE profiles 
       SET full_name = $1, avatar_url = $2, daily_emission_target = $3, monthly_emission_target = $4, preferences = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [mergedFullName, mergedAvatar, mergedDaily, mergedMonthly, prefString, userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        fullName: mergedFullName,
        avatarUrl: mergedAvatar,
        dailyEmissionTarget: mergedDaily,
        monthlyEmissionTarget: mergedMonthly,
        preferences: mergedPref,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile settings.',
    });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  
  try {
    const userRes = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (userRes.rowCount === 0) {
      // Return 200 for security to prevent email enumeration
      return res.json({
        success: true,
        message: 'If the email exists in our system, a password reset link has been sent.',
      });
    }

    // Simulated email sending (production would integrate Nodemailer/Sendgrid)
    console.log(`PASSWORD RESET: Sent recovery token to ${email}`);

    return res.json({
      success: true,
      message: 'If the email exists in our system, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('Reset request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to request password reset.',
    });
  }
};
