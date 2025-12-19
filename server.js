// server.js - Clean version
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const attractionsRoutes = require('./src/routes/attractions.router');
const usersRoutes = require('./src/routes/users.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Traveloki API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/attractions', attractionsRoutes);
app.use('/api/users', usersRoutes);

// API documentation
app.get('/api', (req, res) => {
  res.json({
    message: 'Traveloki API',
    version: '1.0.0',
    endpoints: {
      attractions: '/api/attractions',
      users: '/api/users'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Traveloki Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗺️  Medan attractions: http://localhost:${PORT}/api/attractions/medan`);
});