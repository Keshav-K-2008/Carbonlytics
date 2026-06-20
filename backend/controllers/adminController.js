import { query } from '../config/db.js';
import crypto from 'crypto';
import { z } from 'zod';

export const createChallengeSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pointsReward: z.number().int().positive(),
  badgeRewardId: z.string().uuid().optional().nullable(),
  icon: z.string().optional(),
});

export const publishArticleSchema = z.object({
  title: z.string().min(3),
  content: z.string().min(20),
  category: z.string(),
  author: z.string().optional(),
  readTimeMins: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional().or(z.string().length(0)),
});

export const getAdminStats = async (req, res) => {
  try {
    // 1. User count
    const usersCountRes = await query('SELECT count(*) as count FROM users WHERE role = $1', ['user']);
    const totalUsers = Number(usersCountRes.rows[0]?.count || 0);

    // 2. Average points & Level distribution
    const avgStatsRes = await query(
      'SELECT AVG(total_points) as avg_points, AVG(daily_emission_target) as avg_daily_target FROM profiles'
    );
    const avgPoints = Math.round(Number(avgStatsRes.rows[0]?.avg_points || 0));
    const avgDailyTarget = Number(Number(avgStatsRes.rows[0]?.avg_daily_target || 15).toFixed(1));

    // 3. Level distribution
    const levelRes = await query('SELECT current_level, count(*) as count FROM profiles GROUP BY current_level');
    
    // 4. Total Platform emissions logged
    const emissionsRes = await query(
      'SELECT SUM(calculated_emissions) as total, count(*) as count FROM carbon_activities'
    );
    const totalEmissionsLogged = Number(emissionsRes.rows[0]?.total || 0);
    const totalActivitiesLogged = Number(emissionsRes.rows[0]?.count || 0);

    // 5. Recent signups
    const recentUsersRes = await query(
      `SELECT u.id, u.email, p.full_name, p.total_points, p.current_level, p.created_at 
       FROM users u 
       JOIN profiles p ON u.id = p.id 
       ORDER BY p.created_at DESC LIMIT 10`
    );

    return res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          avgPoints,
          avgDailyTarget,
          totalEmissionsLogged: Number(totalEmissionsLogged.toFixed(1)),
          totalActivitiesLogged,
        },
        levelDistribution: levelRes.rows,
        recentUsers: recentUsersRes.rows,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin system statistics.',
    });
  }
};

export const adminCreateChallenge = async (req, res) => {
  const { title, description, category, startDate, endDate, pointsReward, badgeRewardId, icon } = req.body;

  try {
    const id = crypto.randomUUID();
    await query(
      `INSERT INTO challenges (
        id, title, description, category, start_date, end_date, points_reward, badge_reward_id, icon, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'upcoming')`,
      [id, title, description, category, startDate, endDate, pointsReward, badgeRewardId || null, icon || 'Trophy']
    );

    // Add notifications for all users about the new challenge
    const usersRes = await query('SELECT id FROM users');
    for (const u of usersRes.rows) {
      await query(
        'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
        [
          crypto.randomUUID(),
          u.id,
          'New Platform Challenge!',
          `A new challenge has been announced: "${title}". Enroll now to earn points!`,
          'challenge',
        ]
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Challenge created and broadcasted successfully.',
      data: { id, title },
    });
  } catch (error) {
    console.error('Admin create challenge error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create challenge.',
    });
  }
};

export const adminPublishArticle = async (req, res) => {
  const { title, content, category, author, readTimeMins, imageUrl } = req.body;

  try {
    const id = crypto.randomUUID();
    const computedReadTime = readTimeMins || Math.ceil(content.split(' ').length / 200); // 200 wpm average

    await query(
      `INSERT INTO educational_resources (
        id, title, content, category, author, read_time_mins, image_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')`,
      [id, title, content, category, author || 'Carbonlytix Editor', computedReadTime, imageUrl || null]
    );

    return res.status(201).json({
      success: true,
      message: 'Educational article published successfully.',
      data: { id, title },
    });
  } catch (error) {
    console.error('Admin publish article error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to publish educational article.',
    });
  }
};
