import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import supabase from '../config/supabase.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_carbon_footprint_jwt_key_998877';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. No token provided.',
    });
  }

  // 1. Try Supabase verification if configured
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.app_metadata?.role || 'user',
        };
        return next();
      }
    } catch (err) {
      console.warn('Supabase token verification bypassed, trying local JWT...');
    }
  }

  // 2. Fallback to Local JWT verification
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this resource.`,
      });
    }
    next();
  };
};
