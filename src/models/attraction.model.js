// PERBAIKAN: require dari config/db bukan ./db
const db = require('../config/db');

class Attraction {
  static async findAll(category = null, verifiedOnly = true) {
    let query = `
      SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color,
             u.username as submitted_by_username
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.submitted_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;
    
    if (verifiedOnly) {
      query += ` AND a.is_verified = TRUE`;
    }
    
    if (category) {
      query += ` AND c.name = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    query += ' ORDER BY a.created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const query = `
      SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color,
             u.username as submitted_by_username
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.submitted_by = u.id
      WHERE a.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async searchByName(query, category = null) {
    let sql = `
      SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      WHERE LOWER(a.name) LIKE LOWER($1) AND a.is_verified = TRUE
    `;
    const params = [`%${query}%`];
    
    if (category) {
      sql += ' AND c.name = $2';
      params.push(category);
    }
    
    sql += ' ORDER BY a.name LIMIT 20';
    
    const result = await db.query(sql, params);
    return result.rows;
  }

  static async create(attractionData) {
    const { name, description, lat, lng, address, rating = 0.0, is_verified = false, submitted_by, category_id } = attractionData;
    
    const query = `
      INSERT INTO attractions (name, description, lat, lng, address, rating, is_verified, submitted_by, category_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, description, lat, lng, address, rating, 
      is_verified, submitted_by, category_id
    ]);
    return result.rows[0];
  }

  static async createRecommendation(recommendationData) {
    const { name, description, lat, lng, address, category, submitted_by } = recommendationData;
    
    const query = `
      INSERT INTO user_recommendations (name, description, lat, lng, address, category, submitted_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      name, description, lat, lng, address, category, submitted_by
    ]);
    return result.rows[0];
  }

  static async update(id, attractionData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(attractionData).forEach(key => {
      if (attractionData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(attractionData[key]);
        paramCount++;
      }
    });

    values.push(id);
    const query = `
      UPDATE attractions 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM attractions WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async getByCoordinates(lat, lng, radius = 5) {
    // Earth's radius in kilometers
    const earthRadius = 6371;
    
    const query = `
      SELECT a.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color,
        (${earthRadius} * acos(
          cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))
        )) AS distance
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      WHERE a.is_verified = TRUE AND (${earthRadius} * acos(
        cos(radians($1)) * cos(radians(lat)) *
        cos(radians(lng) - radians($2)) +
        sin(radians($1)) * sin(radians(lat))
      )) < $3
      ORDER BY distance
      LIMIT 50
    `;
    
    const result = await db.query(query, [lat, lng, radius]);
    return result.rows;
  }

  static async getPendingRecommendations() {
    const query = `
      SELECT ur.*, u.username as submitted_by_username, u.email as submitted_by_email
      FROM user_recommendations ur
      JOIN users u ON ur.submitted_by = u.id
      WHERE ur.status = 'pending'
      ORDER BY ur.created_at DESC
    `;
    
    const result = await db.query(query);
    return result.rows;
  }

  static async approveRecommendation(recommendationId, categoryId, reviewedBy, notes = '') {
    // Start transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the recommendation
      const getRecQuery = `
        SELECT * FROM user_recommendations 
        WHERE id = $1 AND status = 'pending' 
        FOR UPDATE
      `;
      const recResult = await client.query(getRecQuery, [recommendationId]);
      
      if (recResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return { success: false, message: 'Recommendation not found or already processed' };
      }
      
      const recommendation = recResult.rows[0];
      
      // Create attraction from recommendation
      const createAttractionQuery = `
        INSERT INTO attractions (name, description, lat, lng, address, rating, is_verified, submitted_by, category_id)
        VALUES ($1, $2, $3, $4, $5, 0.0, TRUE, $6, $7)
        RETURNING *
      `;
      
      const attractionResult = await client.query(createAttractionQuery, [
        recommendation.name,
        recommendation.description,
        recommendation.lat,
        recommendation.lng,
        recommendation.address,
        recommendation.submitted_by,
        categoryId
      ]);
      
      // Update recommendation status
      const updateRecQuery = `
        UPDATE user_recommendations 
        SET status = 'approved', reviewed_by = $1, review_notes = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;
      
      const updatedRecResult = await client.query(updateRecQuery, [
        reviewedBy, notes, recommendationId
      ]);
      
      await client.query('COMMIT');
      
      return {
        success: true,
        recommendation: updatedRecResult.rows[0],
        attraction: attractionResult.rows[0]
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async rejectRecommendation(recommendationId, reviewedBy, notes = '') {
    const query = `
      UPDATE user_recommendations 
      SET status = 'rejected', reviewed_by = $1, review_notes = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3 AND status = 'pending'
      RETURNING *
    `;
    
    const result = await db.query(query, [reviewedBy, notes, recommendationId]);
    return result.rows[0];
  }

  static async getUserRecommendations(userId) {
    const query = `
      SELECT ur.*, c.name as category_name, c.emoji as category_emoji, c.color as category_color
      FROM user_recommendations ur
      LEFT JOIN categories c ON ur.category = c.name
      WHERE ur.submitted_by = $1
      ORDER BY ur.created_at DESC
    `;
    
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_attractions,
        SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_count,
        COUNT(DISTINCT submitted_by) as unique_contributors
      FROM attractions
      
      UNION ALL
      
      SELECT 
        COUNT(*) as total_recommendations,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count
      FROM user_recommendations
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = Attraction;