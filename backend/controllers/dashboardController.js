import { query, dbType } from '../config/db.js';
import { RecommendationsService } from '../services/recommendations.js';
import { PDFGeneratorService } from '../services/pdfGenerator.js';

export const getDashboardData = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch user profile
    const profileRes = await query(
      'SELECT full_name, avatar_url, current_level, total_points, current_streak, highest_streak, daily_emission_target, monthly_emission_target, preferences FROM profiles WHERE id = $1',
      [userId]
    );
    const profile = profileRes.rows[0];
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    if (typeof profile.preferences === 'string') {
      profile.preferences = JSON.parse(profile.preferences);
    }

    // 2. Fetch emissions summaries for time periods (daily, weekly, monthly, lifetime)
    // Daily emissions (today)
    const todayStr = new Date().toISOString().slice(0, 10);
    const dailyEmissionsRes = await query(
      "SELECT SUM(calculated_emissions) as total FROM carbon_activities WHERE user_id = $1 AND activity_date = $2",
      [userId, todayStr]
    );
    const dailyEmissions = Number(dailyEmissionsRes.rows[0]?.total || 0);

    // Weekly emissions (last 7 days)
    const weeklyQuery = dbType === 'postgres'
      ? "SELECT SUM(calculated_emissions) as total FROM carbon_activities WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '7 days'"
      : "SELECT SUM(calculated_emissions) as total FROM carbon_activities WHERE user_id = $1 AND activity_date >= date('now', '-7 days')";
    const weeklyEmissionsRes = await query(weeklyQuery, [userId]);
    const weeklyEmissions = Number(weeklyEmissionsRes.rows[0]?.total || 0);

    // Monthly emissions (last 30 days)
    const monthlyQuery = dbType === 'postgres'
      ? "SELECT SUM(calculated_emissions) as total, COUNT(DISTINCT activity_date) as active_days FROM carbon_activities WHERE user_id = $1 AND activity_date >= CURRENT_DATE - INTERVAL '30 days'"
      : "SELECT SUM(calculated_emissions) as total, COUNT(DISTINCT activity_date) as active_days FROM carbon_activities WHERE user_id = $1 AND activity_date >= date('now', '-30 days')";
    const monthlyEmissionsRes = await query(monthlyQuery, [userId]);
    const monthlyEmissions = Number(monthlyEmissionsRes.rows[0]?.total || 0);
    const activeDaysLastMonth = Number(monthlyEmissionsRes.rows[0]?.active_days || 0);

    // Lifetime emissions
    const lifetimeEmissionsRes = await query(
      "SELECT SUM(calculated_emissions) as total, COUNT(*) as log_count FROM carbon_activities WHERE user_id = $1",
      [userId]
    );
    const lifetimeEmissions = Number(lifetimeEmissionsRes.rows[0]?.total || 0);
    const logCount = Number(lifetimeEmissionsRes.rows[0]?.log_count || 0);

    // 3. Category emissions breakdown
    const categoryRes = await query(
      `SELECT category, SUM(calculated_emissions) as emissions, COUNT(*) as count 
       FROM carbon_activities 
       WHERE user_id = $1 
       GROUP BY category`,
      [userId]
    );
    const categories = {
      transportation: { emissions: 0, count: 0 },
      electricity: { emissions: 0, count: 0 },
      food: { emissions: 0, count: 0 },
      waste: { emissions: 0, count: 0 },
      water: { emissions: 0, count: 0 },
    };
    categoryRes.rows.forEach((row) => {
      if (categories[row.category]) {
        categories[row.category] = {
          emissions: Number(Number(row.emissions).toFixed(2)),
          count: Number(row.count),
        };
      }
    });

    // 4. Calculate dynamic sustainability score (10 to 100)
    // Benchmark: 15kg/day. Calculate daily average over logged active days in past 30 days
    const divisor = activeDaysLastMonth || 1;
    const avgDailyEmissions = monthlyEmissions / divisor;
    
    let baseScore = 50;
    if (monthlyEmissions === 0) {
      baseScore = 75; // Starting score for new users
    } else if (avgDailyEmissions <= 15) {
      baseScore = Math.round(((15 - avgDailyEmissions) / 15) * 40 + 60); // 60 to 100
    } else {
      baseScore = Math.round(Math.max(10, 60 - ((avgDailyEmissions - 15) / 15) * 30)); // 30 to 60, min 10
    }

    // Adjustments: Goal success +5, challenge participation +5
    const goalsAchievedRes = await query(
      "SELECT COUNT(*) as count FROM sustainability_goals WHERE user_id = $1 AND status = 'achieved'",
      [userId]
    );
    const activeChallengesRes = await query(
      "SELECT COUNT(*) as count FROM challenge_participants WHERE user_id = $1 AND status = 'enrolled'",
      [userId]
    );

    const goalsAchieved = Number(goalsAchievedRes.rows[0]?.count || 0);
    const activeChallengesCount = Number(activeChallengesRes.rows[0]?.count || 0);

    const sustainabilityScore = Math.min(100, baseScore + goalsAchieved * 5 + activeChallengesCount * 3);

    // 5. Active Goals Summary
    const goalsRes = await query(
      "SELECT id, category, target_emission, status, progress_pct, end_date FROM sustainability_goals WHERE user_id = $1 AND status = 'active' ORDER BY end_date ASC LIMIT 3",
      [userId]
    );

    // 6. Active Challenges Summary
    const challengesRes = await query(
      `SELECT c.id, c.title, c.icon, cp.progress, cp.status, c.end_date 
       FROM challenge_participants cp
       JOIN challenges c ON cp.challenge_id = c.id
       WHERE cp.user_id = $1 AND cp.status = 'enrolled'
       ORDER BY c.end_date ASC LIMIT 3`,
      [userId]
    );

    // 7. Recent activities
    const recentActivitiesRes = await query(
      "SELECT id, category, subcategory, amount, unit, calculated_emissions, activity_date FROM carbon_activities WHERE user_id = $1 ORDER BY activity_date DESC, created_at DESC LIMIT 5",
      [userId]
    );

    // 8. Dynamic Recommendations (Get top 3)
    const allRecs = await RecommendationsService.getPersonalized(userId);
    const recommendations = allRecs.slice(0, 3);

    // 9. Recent notifications
    const notificationsRes = await query(
      "SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5",
      [userId]
    );

    return res.json({
      success: true,
      data: {
        profile: {
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
          level: profile.current_level,
          points: profile.total_points,
          streak: profile.current_streak,
          highestStreak: profile.highest_streak,
          dailyEmissionTarget: profile.daily_emission_target,
          monthlyEmissionTarget: profile.monthly_emission_target,
          preferences: profile.preferences,
        },
        metrics: {
          dailyEmissions,
          weeklyEmissions,
          monthlyEmissions,
          lifetimeEmissions,
          logCount,
          avgDailyEmissions: Number(avgDailyEmissions.toFixed(2)),
          sustainabilityScore,
        },
        categories,
        activeGoals: goalsRes.rows,
        activeChallenges: challengesRes.rows,
        recentActivities: recentActivitiesRes.rows,
        recommendations,
        notifications: notificationsRes.rows,
      },
    });
  } catch (error) {
    console.error('Fetch dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard summaries.',
    });
  }
};

export const exportReportPDF = async (req, res) => {
  const userId = req.user.id;
  const todayStr = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  try {
    // 1. Retrieve all detailed metrics needed for report
    // A simplified fetch mirroring the dashboard aggregator
    const profileRes = await query('SELECT full_name, current_level, total_points FROM profiles WHERE id = $1', [userId]);
    const userRes = await query('SELECT email FROM users WHERE id = $1', [userId]);
    
    if (profileRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const profile = profileRes.rows[0];
    const user = userRes.rows[0];

    const monthlyEmissionsRes = await query(
      "SELECT SUM(calculated_emissions) as total, COUNT(DISTINCT activity_date) as active_days FROM carbon_activities WHERE user_id = $1 AND activity_date >= $2 AND activity_date <= $3",
      [userId, thirtyDaysAgoStr, todayStr]
    );
    const totalEmissions = Number(monthlyEmissionsRes.rows[0]?.total || 0);
    const activeDays = Number(monthlyEmissionsRes.rows[0]?.active_days || 1);
    
    const categoryRes = await query(
      `SELECT category, SUM(calculated_emissions) as emissions, COUNT(*) as count 
       FROM carbon_activities 
       WHERE user_id = $1 AND activity_date >= $2 AND activity_date <= $3
       GROUP BY category`,
      [userId, thirtyDaysAgoStr, todayStr]
    );

    const categories = {
      transportation: { emissions: 0, count: 0 },
      electricity: { emissions: 0, count: 0 },
      food: { emissions: 0, count: 0 },
      waste: { emissions: 0, count: 0 },
      water: { emissions: 0, count: 0 },
    };
    categoryRes.rows.forEach((row) => {
      if (categories[row.category]) {
        categories[row.category] = {
          emissions: Number(row.emissions),
          count: Number(row.count),
        };
      }
    });

    const recommendations = await RecommendationsService.getPersonalized(userId);
    
    const goalsRes = await query(
      "SELECT category, target_emission, progress_pct FROM sustainability_goals WHERE user_id = $1 AND status = 'active'",
      [userId]
    );
    const badgesRes = await query(
      "SELECT b.title, b.description FROM user_badges ub JOIN badges b ON ub.badge_id = b.id WHERE ub.user_id = $1 ORDER BY ub.unlocked_at DESC LIMIT 3",
      [userId]
    );

    const benchmarkEmissions = (activeDays || 30) * 15; // Benchmark: 15kg CO2e per day

    // Calculate score
    const avgDailyEmissions = totalEmissions / (activeDays || 1);
    let sustainabilityScore = 70;
    if (totalEmissions > 0) {
      if (avgDailyEmissions <= 15) {
        sustainabilityScore = Math.round(((15 - avgDailyEmissions) / 15) * 40 + 60);
      } else {
        sustainabilityScore = Math.round(Math.max(10, 60 - ((avgDailyEmissions - 15) / 15) * 30));
      }
    }

    const reportData = {
      fullName: profile.full_name,
      email: user.email,
      level: profile.current_level,
      points: profile.total_points,
      startDate: thirtyDaysAgoStr,
      endDate: todayStr,
      totalEmissions,
      benchmarkEmissions,
      sustainabilityScore,
      categories,
      recommendations,
      goals: goalsRes.rows,
      badges: badgesRes.rows,
    };

    // 2. Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=carbonlytix_report_${todayStr}.pdf`);

    // 3. Pipe PDF document directly to Express response
    PDFGeneratorService.generateReportPDF(res, reportData);

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PDF report.',
    });
  }
};
