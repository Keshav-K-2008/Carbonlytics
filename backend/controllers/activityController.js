import crypto from 'crypto';
import { query } from '../config/db.js';
import { CalculatorService } from '../services/calculator.js';
import { GamificationService } from '../services/gamification.js';
import { z } from 'zod';

export const logActivitySchema = z.object({
  category: z.enum(['transportation', 'electricity', 'food', 'waste', 'water']),
  subcategory: z.string().min(1),
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().max(255).optional(),
  activityDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
});

export const logActivity = async (req, res) => {
  const { category, subcategory, amount, description, activityDate } = req.body;
  const userId = req.user.id;
  const dateStr = activityDate || new Date().toISOString().slice(0, 10);

  try {
    // 1. Calculate Emissions
    const calc = await CalculatorService.calculate(category, subcategory, amount);

    // 2. Insert Activity Record
    const activityId = crypto.randomUUID();
    
    await query(
      `INSERT INTO carbon_activities (
        id, user_id, category, subcategory, description, amount, unit, emission_factor, calculated_emissions, activity_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        activityId,
        userId,
        category,
        subcategory,
        description || '',
        amount,
        calc.unit,
        calc.emissionFactor,
        calc.calculatedEmissions,
        dateStr,
      ]
    );

    // 3. Process gamification points, levels, streaks, badges
    const rewardDetails = await GamificationService.processActivityReward(userId, {
      category,
      subcategory,
      amount,
    });

    return res.status(201).json({
      success: true,
      message: 'Activity logged successfully',
      data: {
        id: activityId,
        category,
        subcategory,
        amount,
        unit: calc.unit,
        calculatedEmissions: calc.calculatedEmissions,
        activityDate: dateStr,
        rewardDetails,
      },
    });
  } catch (error) {
    console.error('Log activity error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to log carbon footprint activity.',
    });
  }
};

export const getActivities = async (req, res) => {
  const userId = req.user.id;
  const { category, limit = 50, page = 1 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let sql = `SELECT * FROM carbon_activities WHERE user_id = $1`;
    const params = [userId];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ` ORDER BY activity_date DESC, created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit), Number(offset));

    const activitiesRes = await query(sql, params);

    // Total Count for Pagination
    let countSql = `SELECT count(*) as count FROM carbon_activities WHERE user_id = $1`;
    const countParams = [userId];
    if (category) {
      countParams.push(category);
      countSql += ` AND category = $2`;
    }
    const countRes = await query(countSql, countParams);
    const totalCount = Number(countRes.rows[0]?.count || 0);

    return res.json({
      success: true,
      data: activitiesRes.rows,
      pagination: {
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch carbon footprint activities.',
    });
  }
};

export const deleteActivity = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const checkRes = await query('SELECT id, calculated_emissions FROM carbon_activities WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Activity log not found or unauthorized.',
      });
    }

    await query('DELETE FROM carbon_activities WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Activity log deleted successfully.',
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete activity log.',
    });
  }
};

export const getFactors = async (req, res) => {
  try {
    const factors = await CalculatorService.getFactors();
    return res.json({
      success: true,
      data: factors,
    });
  } catch (error) {
    console.error('Get factors error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve emission factors.',
    });
  }
};
