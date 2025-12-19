const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Security tambahan
const morgan = require('morgan'); // Logger request
const rateLimit = require('express-rate-limit'); // Batasi spam request
require('dotenv').config();

// === IMPORT ROUTES ===
// Pastikan nama file di folder routes sesuai ya (attractions.router.js & users.routes.js)
// Jika error "Cannot find module", cek nama file di folder routes abang.
const attractionRoutes = require('./routes/attractions.router'); 
const userRoutes = require('./routes/users.routes'); // Penting buat Login!

const app = express();

// === MIDDLEWARE ===
app.use(helmet()); // Amankan header HTTP
app.use(morgan('dev')); // Log request di terminal
app.use(cors()); // Supaya frontend bisa akses
app.use(express.json()); // Baca JSON dari body request

// Batasi request (Rate Limiter) - Biar gak di-DDOS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // Maksimal 100 request per IP
});
app.use(limiter);

// === ROUTES ===
// Prefix '/api'
app.use('/api/attractions', attractionRoutes); // Endpoint wisata
app.use('/api/users', userRoutes); // Endpoint login/register

// Cek status server
app.get('/', (req, res) => {
  res.send('🚀 Traveloki API is running nicely!');
});

// === SERVER SETUP (VERCEL FRIENDLY) ===
const PORT = process.env.PORT || 5000;

// Logic ini PENTING untuk Vercel:
// Vercel tidak butuh app.listen() karena dia menjalankannya sebagai serverless function.
// app.listen() hanya jalan kalau kita run di localhost (NODE_ENV != production).
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app supaya Vercel bisa membacanya
module.exports = app;