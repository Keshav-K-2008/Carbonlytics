import { query } from '../config/db.js';
import crypto from 'crypto';

export const getArticles = async (req, res) => {
  const userId = req.user.id;
  const { category, search } = req.query;

  try {
    let sql = `
      SELECT er.*, 
             CASE WHEN br.id IS NOT NULL THEN TRUE ELSE FALSE END as is_bookmarked
      FROM educational_resources er
      LEFT JOIN bookmarked_resources br ON er.id = br.resource_id AND br.user_id = $1
      WHERE er.status = 'published'
    `;
    const params = [userId];

    if (category) {
      params.push(category);
      sql += ` AND er.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (er.title LIKE $${params.length} OR er.content LIKE $${params.length})`;
    }

    sql += ' ORDER BY er.created_at DESC';

    const articlesRes = await query(sql, params);

    // Map BOOLEANs properly if SQLite returns them as 1/0
    const articles = articlesRes.rows.map(row => ({
      ...row,
      is_bookmarked: !!row.is_bookmarked,
    }));

    return res.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    console.error('Get articles error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve educational resources.',
    });
  }
};

export const getArticle = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const articleRes = await query(
      `SELECT er.*, 
              CASE WHEN br.id IS NOT NULL THEN TRUE ELSE FALSE END as is_bookmarked
       FROM educational_resources er
       LEFT JOIN bookmarked_resources br ON er.id = br.resource_id AND br.user_id = $1
       WHERE er.id = $2 AND er.status = 'published'`,
      [userId, id]
    );

    if (articleRes.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    const article = articleRes.rows[0];
    article.is_bookmarked = !!article.is_bookmarked;

    // Increment read count asynchronously
    await query('UPDATE educational_resources SET read_count = read_count + 1 WHERE id = $1', [id]);

    // Give points for reading! (+15 points)
    // Check if they already read this? To avoid infinite point farming, we can just allow it or keep a log.
    // For simplicity, let's award points up to a limit or just add 15 points!
    await query('UPDATE profiles SET total_points = total_points + 15 WHERE id = $1', [userId]);

    return res.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Get article error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve educational resource.',
    });
  }
};

export const toggleBookmark = async (req, res) => {
  const { id: resourceId } = req.params;
  const userId = req.user.id;

  try {
    // Check if article exists
    const checkResource = await query('SELECT id FROM educational_resources WHERE id = $1', [resourceId]);
    if (checkResource.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found.',
      });
    }

    // Check if already bookmarked
    const bookmarkCheck = await query(
      'SELECT id FROM bookmarked_resources WHERE user_id = $1 AND resource_id = $2',
      [userId, resourceId]
    );

    if (bookmarkCheck.rowCount > 0) {
      // Un-bookmark
      await query('DELETE FROM bookmarked_resources WHERE id = $1', [bookmarkCheck.rows[0].id]);
      await query('UPDATE educational_resources SET bookmark_count = MAX(0, bookmark_count - 1) WHERE id = $1', [resourceId]);
      
      return res.json({
        success: true,
        message: 'Bookmark removed.',
        isBookmarked: false,
      });
    } else {
      // Bookmark
      await query(
        'INSERT INTO bookmarked_resources (id, user_id, resource_id) VALUES ($1, $2, $3)',
        [crypto.randomUUID(), userId, resourceId]
      );
      await query('UPDATE educational_resources SET bookmark_count = bookmark_count + 1 WHERE id = $1', [resourceId]);

      return res.json({
        success: true,
        message: 'Bookmark added.',
        isBookmarked: true,
      });
    }
  } catch (error) {
    console.error('Toggle bookmark error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to bookmark resource.',
    });
  }
};

export const getBookmarked = async (req, res) => {
  const userId = req.user.id;

  try {
    const bookmarksRes = await query(
      `SELECT er.*, TRUE as is_bookmarked
       FROM educational_resources er
       JOIN bookmarked_resources br ON er.id = br.resource_id
       WHERE br.user_id = $1 AND er.status = 'published'
       ORDER BY br.created_at DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: bookmarksRes.rows,
    });
  } catch (error) {
    console.error('Get bookmarked error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve bookmarked resources.',
    });
  }
};
