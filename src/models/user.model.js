const bcrypt = require('bcryptjs');
// PERBAIKAN: require dari config/db bukan ./db
const db = require('../config/db');

class User {
  static async findAll() {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await db.query(query, [username]);
    return result.rows[0];
  }

  static async create(userData) {
    const { email, username, password, full_name, role = 'user' } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    const query = `
      INSERT INTO users (email, username, password_hash, full_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const result = await db.query(query, [
      email, 
      username, 
      password_hash, 
      full_name, 
      role
    ]);
    return result.rows[0];
  }

  static async update(id, userData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(userData).forEach(key => {
      if (userData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(userData[key]);
        paramCount++;
      }
    });

    values.push(id);
    const query = `
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, values);
    return result.rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING *';
    const result = await db.query(query, [id]);
    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);
    
    const query = `
      UPDATE users 
      SET password_hash = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await db.query(query, [password_hash, id]);
    return result.rows[0];
  }

  static async getStats() {
    const query = `
      SELECT 
        role,
        COUNT(*) as count,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
      FROM users
      GROUP BY role
    `;
    
    const result = await db.query(query);
    return result.rows;
  }
}

module.exports = User;