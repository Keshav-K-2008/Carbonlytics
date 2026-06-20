import { query } from '../config/db.js';
import crypto from 'crypto';

export class GamificationService {
  /**
   * Updates user points, processes level up, checks streaks, and evaluates achievements/badges.
   * Runs after user logs a new activity.
   */
  static async processActivityReward(userId, activityDetail) {
    const notifications = [];
    const unlockedBadges = [];
    const unlockedAchievements = [];

    // 1. Fetch current profile
    const profileRes = await query(
      'SELECT total_points, current_streak, highest_streak, last_activity_date, current_level FROM profiles WHERE id = $1',
      [userId]
    );

    if (profileRes.rowCount === 0) return { unlockedBadges, unlockedAchievements };

    const profile = profileRes.rows[0];
    let pointsToAdd = 10; // Base points for logging any activity
    let newStreak = profile.current_streak;
    let newHighestStreak = profile.highest_streak;
    const todayStr = new Date().toISOString().slice(0, 10);
    const lastActivityDateStr = profile.last_activity_date;

    // 2. Streak logic
    if (!lastActivityDateStr) {
      // First activity ever
      newStreak = 1;
      newHighestStreak = 1;
    } else {
      const today = new Date(todayStr);
      const lastDate = new Date(lastActivityDateStr);
      const diffTime = Math.abs(today - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Logged yesterday: Increment streak
        newStreak += 1;
        if (newStreak > newHighestStreak) {
          newHighestStreak = newStreak;
        }
        // Reward additional points for streak maintenance
        pointsToAdd += newStreak * 2;
      } else if (diffDays > 1) {
        // Streak broken
        newStreak = 1;
      }
      // If diffDays === 0 (already logged today), streak stays the same
    }

    const newPoints = profile.total_points + pointsToAdd;

    // 3. Level Logic
    let newLevel = 'Beginner';
    if (newPoints > 10000) newLevel = 'Earth Guardian';
    else if (newPoints > 6000) newLevel = 'Sustainability Champion';
    else if (newPoints > 3000) newLevel = 'Green Warrior';
    else if (newPoints > 1500) newLevel = 'Eco Explorer';
    else if (newPoints > 500) newLevel = 'Aware Citizen';

    // Update Profile
    await query(
      `UPDATE profiles 
       SET total_points = $1, current_streak = $2, highest_streak = $3, last_activity_date = $4, current_level = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [newPoints, newStreak, newHighestStreak, todayStr, newLevel, userId]
    );

    if (newLevel !== profile.current_level) {
      notifications.push({
        title: 'Level Up!',
        message: `Congratulations! You have advanced to the Level: ${newLevel}! Keep protecting the earth.`,
        type: 'achievement',
      });
    }

    // 4. Check & Unlock Badges
    const badgeUnlocks = await this.checkBadges(userId, activityDetail);
    for (const b of badgeUnlocks) {
      unlockedBadges.push(b);
      notifications.push({
        title: 'New Badge Unlocked!',
        message: `You earned the '${b.title}' badge: ${b.description}`,
        type: 'achievement',
      });
    }

    // 5. Check & Unlock Achievements
    const achievementUnlocks = await this.checkAchievements(userId, newPoints, newStreak);
    for (const a of achievementUnlocks) {
      unlockedAchievements.push(a);
      notifications.push({
        title: 'Achievement Unlocked!',
        message: `Unlocked: '${a.title}' - ${a.description}`,
        type: 'achievement',
      });
    }

    // 6. Write notifications to database
    for (const n of notifications) {
      await query(
        'INSERT INTO notifications (id, user_id, title, message, type, is_read) VALUES ($1, $2, $3, $4, $5, 0)',
        [crypto.randomUUID(), userId, n.title, n.message, n.type]
      );
    }

    return {
      pointsEarned: pointsToAdd,
      newPoints,
      newStreak,
      newLevel,
      unlockedBadges,
      unlockedAchievements,
    };
  }

  /**
   * Helper to evaluate and unlock badges based on activity criteria
   */
  static async checkBadges(userId, currentActivity) {
    const unlocked = [];

    // Get badges already unlocked to avoid duplicate unlocks
    const userBadgesRes = await query('SELECT badge_id FROM user_badges WHERE user_id = $1', [userId]);
    const unlockedIds = userBadgesRes.rows.map((row) => row.badge_id);

    const checkAndAward = async (badgeId, isEligible) => {
      if (isEligible && !unlockedIds.includes(badgeId)) {
        // Fetch badge detail
        const badgeRes = await query('SELECT id, title, description FROM badges WHERE id = $1', [badgeId]);
        if (badgeRes.rowCount > 0) {
          const badge = badgeRes.rows[0];
          await query(
            'INSERT INTO user_badges (id, user_id, badge_id) VALUES ($1, $2, $3)',
            [crypto.randomUUID(), userId, badgeId]
          );
          unlocked.push(badge);
        }
      }
    };

    // 1. Eco Novice (First activity logged)
    await checkAndAward('b1000000-0000-0000-0000-000000000001', true);

    // 2. Green Pedaler (Cycling or walking distance > 50km)
    if (
      currentActivity.category === 'transportation' &&
      (currentActivity.subcategory === 'bus' || currentActivity.subcategory === 'train') // public/clean transit
    ) {
      const publicTransitRes = await query(
        "SELECT SUM(amount) as total FROM carbon_activities WHERE user_id = $1 AND category = 'transportation' AND subcategory IN ('bus', 'train')",
        [userId]
      );
      const totalDist = Number(publicTransitRes.rows[0]?.total || 0);
      await checkAndAward('b1000000-0000-0000-0000-000000000002', totalDist >= 50);
    }

    // 3. Plant Powered (10 vegetarian/vegan meals consecutively)
    if (currentActivity.category === 'food' && ['vegetarian', 'vegan'].includes(currentActivity.subcategory)) {
      const mealsRes = await query(
        `SELECT subcategory FROM carbon_activities 
         WHERE user_id = $1 AND category = 'food' 
         ORDER BY activity_date DESC, created_at DESC LIMIT 10`,
        [userId]
      );
      const allVeg = mealsRes.rowCount >= 10 && mealsRes.rows.every((row) => ['vegetarian', 'vegan'].includes(row.subcategory));
      await checkAndAward('b1000000-0000-0000-0000-000000000004', allVeg);
    }

    return unlocked;
  }

  /**
   * Helper to evaluate and unlock achievements
   */
  static async checkAchievements(userId, totalPoints, currentStreak) {
    const unlocked = [];

    // Get current unlocked achievements
    const unlockedRes = await query('SELECT achievement_id FROM user_achievements WHERE user_id = $1', [userId]);
    const unlockedIds = unlockedRes.rows.map((row) => row.achievement_id);

    // Fetch all achievements
    const allAchievementsRes = await query('SELECT id, title, description, criteria_type, criteria_value, icon FROM achievements');
    
    for (const a of allAchievementsRes.rows) {
      if (unlockedIds.includes(a.id)) continue;

      let meetsCriteria = false;

      if (a.criteria_type === 'points_earned' && totalPoints >= a.criteria_value) {
        meetsCriteria = true;
      } else if (a.criteria_type === 'streak_days' && currentStreak >= a.criteria_value) {
        meetsCriteria = true;
      } else if (a.criteria_type === 'emissions_reduced') {
        // Calculate estimated savings compared to an average user benchmark (say 15kg CO2e daily average)
        // Average user = 15kg/day. User total logged activities compared to benchmark.
        // Let's check how much carbon they saved below their goal threshold
        const emissionsRes = await query(
          "SELECT SUM(calculated_emissions) as total, COUNT(DISTINCT activity_date) as active_days FROM carbon_activities WHERE user_id = $1",
          [userId]
        );
        const totalEmissions = Number(emissionsRes.rows[0]?.total || 0);
        const activeDays = Number(emissionsRes.rows[0]?.active_days || 1);
        const benchmarkEmissions = activeDays * 15; // Benchmark 15 kg per day
        const saved = benchmarkEmissions - totalEmissions;

        if (saved >= a.criteria_value) {
          meetsCriteria = true;
        }
      } else if (a.criteria_type === 'challenges_completed') {
        const completedRes = await query(
          "SELECT COUNT(*) as count FROM challenge_participants WHERE user_id = $1 AND status = 'completed'",
          [userId]
        );
        const completedChallenges = Number(completedRes.rows[0]?.count || 0);
        if (completedChallenges >= a.criteria_value) {
          meetsCriteria = true;
        }
      }

      if (meetsCriteria) {
        await query(
          'INSERT INTO user_achievements (id, user_id, achievement_id) VALUES ($1, $2, $3)',
          [crypto.randomUUID(), userId, a.id]
        );
        unlocked.push(a);
      }
    }

    return unlocked;
  }
}
