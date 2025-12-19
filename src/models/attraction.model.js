// src/models/attraction.model.js
const db = require('../config/db');

class Attraction {
  // Ambil semua data (bisa filter verified only)
  static async findAll(category, verifiedOnly = true) {
    let query = `
      SELECT a.*, c.name as category_name, u.username as submitted_by_username
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.submitted_by = u.id
    `;
    const params = [];
    if (verifiedOnly) {
      query += ` WHERE a.is_verified = true`;
    }
    
    query += ` ORDER BY a.created_at DESC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  // Cari berdasarkan ID
  static async findById(id) {
    const query = `
      SELECT a.*, c.name as category_name, u.username as submitted_by_username
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN users u ON a.submitted_by = u.id
      WHERE a.id = $1
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  // Search by Name
  static async searchByName(q) {
    const query = `
      SELECT a.*, c.name as category_name 
      FROM attractions a
      JOIN categories c ON a.category_id = c.id
      WHERE (a.name ILIKE $1 OR a.description ILIKE $1) AND a.is_verified = true
    `;
    const result = await db.query(query, [`%${q}%`]);
    return result.rows;
  }

  // Nearby (Geospatial)
  static async getByCoordinates(lat, lng, radiusKm) {
    const query = `
      SELECT *, 
      ( 6371 * acos( cos( radians($1) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians($2) ) + sin( radians($1) ) * sin( radians( lat ) ) ) ) AS distance 
      FROM attractions 
      WHERE is_verified = true
      AND ( 6371 * acos( cos( radians($1) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians($2) ) + sin( radians($1) ) * sin( radians( lat ) ) ) ) < $3
      ORDER BY distance ASC
    `;
    const result = await db.query(query, [lat, lng, radiusKm]);
    return result.rows;
  }

  // === FITUR BARU: CREATE LANGSUNG (ADMIN) ===
  static async create(data) {
    const { name, description, lat, lng, address, category, submitted_by } = data;
    
    // Cari ID kategori berdasarkan nama (food/fun/hotels)
    // Default ke 1 jika tidak ketemu
    const catRes = await db.query('SELECT id FROM categories WHERE name = $1', [category.toLowerCase()]);
    const category_id = catRes.rows[0] ? catRes.rows[0].id : 1; 

    const query = `
      INSERT INTO attractions (name, description, lat, lng, address, category_id, submitted_by, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      RETURNING *
    `;
    const values = [name, description, lat, lng, address, category_id, submitted_by];
    const result = await db.query(query, values);
    return result.rows[0];
  }

  // Hapus Data
  static async delete(id) {
    await db.query('DELETE FROM attractions WHERE id = $1', [id]);
  }

  // === USER RECOMMENDATIONS (FLOW USER BIASA) ===
  static async createRecommendation(data) {
    const { name, description, lat, lng, address, category, submitted_by } = data;
    const query = `
      INSERT INTO user_recommendations (name, description, lat, lng, address, category, submitted_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *
    `;
    const result = await db.query(query, [name, description, lat, lng, address, category, submitted_by]);
    return result.rows[0];
  }

  static async getPendingRecommendations() {
    const query = `
      SELECT r.*, u.username as submitted_by_username 
      FROM user_recommendations r
      LEFT JOIN users u ON r.submitted_by = u.id
      WHERE r.status = 'pending'
      ORDER BY r.created_at DESC
    `;
    const result = await db.query(query);
    return result.rows;
  }

  static async approveRecommendation(recId, categoryId, adminId) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      
      const recRes = await client.query('SELECT * FROM user_recommendations WHERE id = $1', [recId]);
      const rec = recRes.rows[0];
      if (!rec) throw new Error('Recommendation not found');

      const insertQuery = `
        INSERT INTO attractions (name, description, lat, lng, address, category_id, submitted_by, is_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        RETURNING *
      `;
      const attraction = await client.query(insertQuery, [
        rec.name, rec.description, rec.lat, rec.lng, rec.address, categoryId, rec.submitted_by
      ]);

      await client.query(
        `UPDATE user_recommendations SET status = 'approved', reviewed_by = $1, review_notes = 'Approved' WHERE id = $2`,
        [adminId, recId]
      );

      await client.query('COMMIT');
      return { success: true, attraction: attraction.rows[0] };
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  static async rejectRecommendation(recId, adminId) {
    await db.query(
      `UPDATE user_recommendations SET status = 'rejected', reviewed_by = $1 WHERE id = $2`,
      [adminId, recId]
    );
  }
}

module.exports = Attraction;
