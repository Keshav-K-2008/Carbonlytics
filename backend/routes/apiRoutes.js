import express from 'express';
import { protect } from '../middleware/auth.js';
import { WeatherService } from '../services/weatherService.js';
import { NewsService } from '../services/newsService.js';
import { GroqService } from '../services/groqService.js';
import { EmailService } from '../services/emailService.js';
import { query, dbType } from '../config/db.js';
import crypto from 'crypto';

const router = express.Router();

// 1. Weather and Air Quality Endpoint
router.get('/weather', protect, async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, message: 'Latitude (lat) and Longitude (lon) are required query parameters.' });
  }

  try {
    const data = await WeatherService.getWeatherAndAirQuality(lat, lon);
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Weather route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch weather and air quality.' });
  }
});

// 2. Climate News Hub Endpoint
router.get('/news', protect, async (req, res) => {
  try {
    const data = await NewsService.getClimateNews();
    return res.json({ success: true, data });
  } catch (err) {
    console.error('News route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch climate news.' });
  }
});

// 3. EcoChat AI Chatbot Endpoint
router.post('/chat', protect, async (req, res) => {
  const { message, context = {} } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: 'Message payload is required.' });
  }

  try {
    // Fetch profile data to ground the AI model with user context
    const profileRes = await query(
      'SELECT full_name, total_points, current_level FROM profiles WHERE id = $1',
      [req.user.id]
    );
    const profile = profileRes.rows[0] || {};
    
    // Fetch user activities sum for categories context
    const emissionsQuery = dbType === 'postgres'
      ? `SELECT category, SUM(calculated_emissions) as total 
         FROM carbon_activities 
         WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '30 days' 
         GROUP BY category`
      : `SELECT category, SUM(calculated_emissions) as total 
         FROM carbon_activities 
         WHERE user_id = $1 AND activity_date >= date('now', '-30 days') 
         GROUP BY category`;
    const emissionsRes = await query(emissionsQuery, [req.user.id]);
    const categories = { transportation: 0, electricity: 0, food: 0, waste: 0, water: 0 };
    let monthlyEmissions = 0;
    emissionsRes.rows.forEach(row => {
      categories[row.category] = Number(row.total);
      monthlyEmissions += Number(row.total);
    });

    const enrichedContext = {
      fullName: profile.full_name || 'Eco User',
      metrics: {
        monthlyEmissions,
        ...categories
      },
      ...context
    };

    const reply = await GroqService.getChatResponse(message, enrichedContext);
    return res.json({ success: true, reply });
  } catch (err) {
    console.error('Chat route error:', err);
    return res.status(500).json({ success: false, message: 'AI model failed to respond.' });
  }
});

// 4. Carbon Offsetting purchase simulation
router.post('/offsets/simulate', protect, async (req, res) => {
  const { offsetType, amount, cost } = req.body; // e.g., offsetType: "tree_planting", amount: 10 (trees), cost: 15 (USD)
  
  if (!offsetType || !amount || !cost) {
    return res.status(400).json({ success: false, message: 'offsetType, amount, and cost parameters are required.' });
  }

  const userId = req.user.id;
  const pointsReward = 150; // Award 150 points for offsetting carbon footprints!

  try {
    // 1. Fetch current profile
    const profileRes = await query(
      'SELECT total_points, current_level FROM profiles WHERE id = $1',
      [userId]
    );
    if (profileRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const profile = profileRes.rows[0];
    const newPoints = profile.total_points + pointsReward;

    // Recalculate level
    let newLevel = 'Beginner';
    if (newPoints > 10000) newLevel = 'Earth Guardian';
    else if (newPoints > 6000) newLevel = 'Sustainability Champion';
    else if (newPoints > 3000) newLevel = 'Green Warrior';
    else if (newPoints > 1500) newLevel = 'Eco Explorer';
    else if (newPoints > 500) newLevel = 'Aware Citizen';

    // 2. Update profiles table
    await query(
      `UPDATE profiles 
       SET total_points = $1, current_level = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [newPoints, newLevel, userId]
    );

    // 3. Create Notification
    const offsetName = offsetType === 'tree_planting' ? 'Tree Planting Program' : 'Wind/Solar Clean Energy Offset';
    const notifId = crypto.randomUUID();
    await query(
      'INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES ($1, $2, $3, $4, $5, 0)',
      [
        notifId,
        userId,
        'Offset Certificate Earned!',
        `Thank you for offsetting your carbon footprint. You contributed to '${offsetName}' (${amount} units) for $${cost}. +${pointsReward} XP awarded!`,
        'system'
      ]
    );

    // 4. Send email confirmation if Resend configured
    const emailRes = await query('SELECT email FROM users WHERE id = $1', [userId]);
    if (emailRes.rowCount > 0) {
      const email = emailRes.rows[0].email;
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #10b981; border-radius: 8px;">
          <h2 style="color: #10b981; margin-bottom: 20px;">Carbon Offset Certificate</h2>
          <p>This certifies that <strong>${profile.full_name || 'Eco Warrior'}</strong> has successfully sponsored:</p>
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #15803d;">${offsetName}</p>
            <p style="margin: 5px 0 0 0; color: #166534;">Units: ${amount} | Total Paid: $${cost} USD</p>
          </div>
          <p>Your contribution has directly offset environmental emissions. As a thank you, we have credited <strong>+${pointsReward} XP</strong> to your Carbonlytix profile.</p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 35px;">Certificate ID: ${crypto.randomUUID()}</p>
        </div>
      `;
      await EmailService.sendEmail(email, `Your Carbonlytix Offset Certificate: ${offsetName}`, emailHtml);
    }

    return res.json({
      success: true,
      message: 'Offset purchase simulated successfully and profile updated.',
      data: {
        pointsEarned: pointsReward,
        newPoints,
        newLevel,
        offsetCertificate: {
          id: crypto.randomUUID(),
          offsetType,
          amount,
          cost,
          timestamp: new Date().toISOString()
        }
      }
    });
  } catch (err) {
    console.error('Offset simulation route error:', err);
    return res.status(500).json({ success: false, message: 'Failed to simulate offset purchase.' });
  }
});

// 5. Temporary DB Diagnostic Endpoint
router.get('/debug-db', async (req, res) => {
  const diagnostics = {
    DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
    DATABASE_URL_PARTIAL: process.env.DATABASE_URL ? process.env.DATABASE_URL.split('@')[1] : 'undefined',
    dbType: dbType,
    VERCEL: !!process.env.VERCEL,
    NODE_ENV: process.env.NODE_ENV,
    envKeys: Object.keys(process.env).join(', ')
  };

  try {
    const testQuery = await query('SELECT 1 as connected');
    diagnostics.dbConnection = (testQuery.rows && testQuery.rows[0]?.connected == 1) ? 'SUCCESS' : 'FAILED';
    
    if (dbType === 'postgres') {
      const tablesRes = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      diagnostics.tables = tablesRes.rows.map(row => row.table_name);
    } else {
      const tablesRes = await query("SELECT name FROM sqlite_master WHERE type='table'");
      diagnostics.tables = tablesRes.rows.map(row => row.name);
    }
  } catch (err) {
    diagnostics.error = {
      message: err.message,
      stack: err.stack,
    };
  }

  res.json({ success: true, diagnostics });
});

export default router;
