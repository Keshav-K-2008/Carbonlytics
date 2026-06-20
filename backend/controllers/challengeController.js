import { query } from '../config/db.js';
import crypto from 'crypto';

export const getChallenges = async (req, res) => {
  const userId = req.user.id;

  try {
    // 1. Fetch all challenges
    const challengesRes = await query('SELECT * FROM challenges ORDER BY start_date ASC');
    const challenges = challengesRes.rows;

    // 2. Fetch user's enrollments
    const enrollmentsRes = await query(
      'SELECT challenge_id, status, progress, enrolled_at, completed_at FROM challenge_participants WHERE user_id = $1',
      [userId]
    );
    const enrollments = enrollmentsRes.rows;

    // 3. Map enrollments to challenges
    const mappedChallenges = challenges.map((c) => {
      const enrollment = enrollments.find((e) => e.challenge_id === c.id);
      
      // Calculate active status dynamically based on current date
      const todayStr = new Date().toISOString().slice(0, 10);
      let calculatedStatus = c.status;
      if (todayStr < c.start_date) {
        calculatedStatus = 'upcoming';
      } else if (todayStr > c.end_date) {
        calculatedStatus = 'completed';
      } else {
        calculatedStatus = 'active';
      }

      return {
        ...c,
        status: calculatedStatus,
        isEnrolled: !!enrollment,
        enrollmentDetails: enrollment || null,
      };
    });

    return res.json({
      success: true,
      data: mappedChallenges,
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve challenges list.',
    });
  }
};

export const enrollInChallenge = async (req, res) => {
  const { id: challengeId } = req.params;
  const userId = req.user.id;

  try {
    // Check if challenge exists
    const challengeRes = await query('SELECT * FROM challenges WHERE id = $1', [challengeId]);
    if (challengeRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found.',
      });
    }

    const challenge = challengeRes.rows[0];
    const todayStr = new Date().toISOString().slice(0, 10);
    
    if (todayStr > challenge.end_date) {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll in a completed challenge.',
      });
    }

    // Check if already enrolled
    const checkRes = await query(
      'SELECT id FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2',
      [challengeId, userId]
    );

    if (checkRes.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this challenge.',
      });
    }

    // Enroll
    const enrollmentId = crypto.randomUUID();
    await query(
      'INSERT INTO challenge_participants (id, challenge_id, user_id, status, progress) VALUES ($1, $2, $3, $4, $5)',
      [enrollmentId, challengeId, userId, 'enrolled', 0.00]
    );

    // Add Notification
    await query(
      'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
      [
        crypto.randomUUID(),
        userId,
        'Enrolled in Challenge!',
        `You have successfully enrolled in '${challenge.title}'. Start completing activities to earn points!`,
        'challenge',
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in challenge',
      data: {
        id: enrollmentId,
        challengeId,
        userId,
        status: 'enrolled',
        progress: 0,
      },
    });
  } catch (error) {
    console.error('Enroll challenge error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to enroll in challenge.',
    });
  }
};

export const updateChallengeProgress = async (req, res) => {
  const { id: challengeId } = req.params;
  const { progress } = req.body; // percentage 0 to 100
  const userId = req.user.id;

  try {
    const participantRes = await query(
      'SELECT id, status FROM challenge_participants WHERE challenge_id = $1 AND user_id = $2',
      [challengeId, userId]
    );

    if (participantRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found.',
      });
    }

    const enrollment = participantRes.rows[0];
    if (enrollment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Challenge is already completed.',
      });
    }

    let status = 'enrolled';
    let completedAt = null;
    let rewardResult = null;

    if (progress >= 100) {
      status = 'completed';
      completedAt = new Date().toISOString();

      // Fetch challenge details for rewards
      const challengeRes = await query('SELECT points_reward, badge_reward_id, title FROM challenges WHERE id = $1', [challengeId]);
      const challenge = challengeRes.rows[0];

      // Award points
      await query('UPDATE profiles SET total_points = total_points + $1 WHERE id = $2', [challenge.points_reward, userId]);

      // Award badge if configured
      if (challenge.badge_reward_id) {
        // Check if user already has the badge
        const badgeCheck = await query('SELECT id FROM user_badges WHERE user_id = $1 AND badge_id = $2', [userId, challenge.badge_reward_id]);
        if (badgeCheck.rowCount === 0) {
          await query('INSERT INTO user_badges (id, user_id, badge_id) VALUES ($1, $2, $3)', [
            crypto.randomUUID(),
            userId,
            challenge.badge_reward_id,
          ]);
        }
      }

      // Add Notification
      await query(
        'INSERT INTO notifications (id, user_id, title, message, type) VALUES ($1, $2, $3, $4, $5)',
        [
          crypto.randomUUID(),
          userId,
          'Challenge Completed!',
          `Incredible! You completed the challenge '${challenge.title}' and earned ${challenge.points_reward} points!`,
          'challenge',
        ]
      );

      rewardResult = {
        pointsReward: challenge.points_reward,
        badgeRewardId: challenge.badge_reward_id,
      };
    }

    await query(
      'UPDATE challenge_participants SET progress = $1, status = $2, completed_at = $3 WHERE id = $4',
      [progress, status, completedAt, enrollment.id]
    );

    return res.json({
      success: true,
      message: 'Challenge progress updated successfully',
      data: {
        progress,
        status,
        completedAt,
        rewardResult,
      },
    });
  } catch (error) {
    console.error('Update challenge progress error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update challenge progress.',
    });
  }
};
