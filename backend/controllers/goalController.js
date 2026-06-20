import crypto from 'crypto';
import { query } from '../config/db.js';
import { z } from 'zod';

export const goalSchema = z.object({
  targetType: z.enum(['monthly', 'quarterly', 'yearly']),
  category: z.enum(['overall', 'transportation', 'electricity', 'food', 'waste', 'water']),
  targetReductionPct: z.number().min(1).max(100),
  targetEmission: z.number().positive(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const createGoal = async (req, res) => {
  const { targetType, category, targetReductionPct, targetEmission, startDate, endDate } = req.body;
  const userId = req.user.id;

  try {
    const goalId = crypto.randomUUID();
    await query(
      `INSERT INTO sustainability_goals (
        id, user_id, target_type, category, target_reduction_pct, target_emission, start_date, end_date, status, progress_pct
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', 0.00)`,
      [goalId, userId, targetType, category, targetReductionPct, targetEmission, startDate, endDate]
    );

    return res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: {
        id: goalId,
        targetType,
        category,
        targetReductionPct,
        targetEmission,
        startDate,
        endDate,
        status: 'active',
        progressPct: 0,
      },
    });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create sustainability goal.',
    });
  }
};

export const getGoals = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch all goals
    const goalsRes = await query('SELECT * FROM sustainability_goals WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    const goals = goalsRes.rows;

    // 2. Compute dynamic progress for active/failed/achieved goals
    for (const goal of goals) {
      // Sum emissions for this goal category and time frame
      let sumRes;
      if (goal.category === 'overall') {
        sumRes = await query(
          'SELECT SUM(calculated_emissions) as total FROM carbon_activities WHERE user_id = $1 AND activity_date >= $2 AND activity_date <= $3',
          [userId, goal.start_date, goal.end_date]
        );
      } else {
        sumRes = await query(
          'SELECT SUM(calculated_emissions) as total FROM carbon_activities WHERE user_id = $1 AND category = $2 AND activity_date >= $3 AND activity_date <= $4',
          [userId, goal.category, goal.start_date, goal.end_date]
        );
      }

      const emissionsSum = Number(sumRes.rows[0]?.total || 0);
      
      // Calculate progress percentage of target threshold consumed
      let progressPct = (emissionsSum / goal.target_emission) * 100;
      progressPct = Number(Math.min(100, progressPct).toFixed(2));
      
      let newStatus = goal.status;
      const todayStr = new Date().toISOString().slice(0, 10);
      
      if (goal.status === 'active') {
        if (todayStr > goal.end_date) {
          // Time expired
          if (emissionsSum <= goal.target_emission) {
            newStatus = 'achieved';
            // Reward bonus points for achievement
            await query('UPDATE profiles SET total_points = total_points + 100 WHERE id = $1', [userId]);
          } else {
            newStatus = 'failed';
          }

          // Update database
          await query(
            'UPDATE sustainability_goals SET status = $1, progress_pct = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [newStatus, progressPct, goal.id]
          );
        } else {
          // If still active but breached already
          if (emissionsSum > goal.target_emission) {
            // Wait, does exceeding mean they failed immediately? 
            // In carbon reduction, if you exceed the limit, you have breached/failed the limit.
            // Let's show they consumed 100% of their carbon limit
            progressPct = 100;
          }
        }
      }

      goal.progress_pct = progressPct;
      goal.current_emissions = Number(emissionsSum.toFixed(2));
      goal.status = newStatus;
    }

    return res.json({
      success: true,
      data: goals,
    });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve sustainability goals.',
    });
  }
};

export const deleteGoal = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const checkRes = await query('SELECT id FROM sustainability_goals WHERE id = $1 AND user_id = $2', [id, userId]);
    if (checkRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    await query('DELETE FROM sustainability_goals WHERE id = $1', [id]);

    return res.json({
      success: true,
      message: 'Sustainability goal deleted successfully.',
    });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete sustainability goal.',
    });
  }
};
