// database/reset.js
const { setupDatabase } = require('./setup');
require('dotenv').config();

async function resetDatabase() {
  console.log('🔄 Resetting Traveloki database...');
  
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Drop all tables
    const dropSchema = `
      DROP TABLE IF EXISTS user_recommendations CASCADE;
      DROP TABLE IF EXISTS reviews CASCADE;
      DROP TABLE IF EXISTS attractions CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      DROP TRIGGER IF EXISTS update_attractions_updated_at ON attractions CASCADE;
      DROP TRIGGER IF EXISTS update_users_updated_at ON users CASCADE;
      DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews CASCADE;
      DROP TRIGGER IF EXISTS update_user_recommendations_updated_at ON user_recommendations CASCADE;
      DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
    `;
    
    await pool.query(dropSchema);
    console.log('🗑️  Old tables dropped');
    
    // Run setup again
    await setupDatabase();
    
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };