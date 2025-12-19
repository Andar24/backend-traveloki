const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  console.log('🔄 Setting up Traveloki database with Admin/User roles...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('📝 Creating tables...');
    await pool.query(schema);
    console.log('✅ Tables created successfully');
    
    // Read and execute seed data
    const seedPath = path.join(__dirname, 'seed.sql');
    const seed = await fs.readFile(seedPath, 'utf8');
    
    console.log('🌱 Inserting seed data...');
    await pool.query(seed);
    console.log('✅ Seed data inserted successfully');
    
    // Verify data
    const categoriesResult = await pool.query('SELECT COUNT(*) FROM categories');
    const usersResult = await pool.query('SELECT COUNT(*) FROM users');
    const attractionsResult = await pool.query('SELECT COUNT(*) FROM attractions');
    const recommendationsResult = await pool.query('SELECT COUNT(*) FROM user_recommendations');
    
    console.log(`📊 Database setup complete!`);
    console.log(`   - Categories: ${categoriesResult.rows[0].count} entries`);
    console.log(`   - Users: ${usersResult.rows[0].count} entries`);
    console.log(`   - Attractions: ${attractionsResult.rows[0].count} entries`);
    console.log(`   - User Recommendations: ${recommendationsResult.rows[0].count} entries`);
    
    // Show admin credentials
    console.log('\n🔐 Default Admin Credentials:');
    console.log('   Email: admin@traveloki.com');
    console.log('   Password: AdminTraveloki123');
    console.log('\n👤 Default User Credentials:');
    console.log('   Email: user@traveloki.com');
    console.log('   Password: User12345');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    
    if (error.code === '28P01') {
      console.error('   💡 Check your DATABASE_URL in .env file');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   💡 Check your database connection string');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };