// src/routes/attractions.router.js
const express = require('express');
const router = express.Router();
const attractionsController = require('../controllers/attractions.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public Routes
router.get('/', attractionsController.getAllAttractions);
router.get('/medan', attractionsController.getMedanAttractions);
router.get('/search', attractionsController.searchAttractions);
router.get('/nearby', attractionsController.getNearbyAttractions);
router.get('/:id', attractionsController.getAttractionById);

// User Routes
router.post('/recommend', authenticate, attractionsController.submitRecommendation);

// ADMIN ROUTES (Protected)
router.get('/recommendations/pending', authenticate, isAdmin, attractionsController.getPendingRecommendations);
router.post('/recommendations/:id/approve', authenticate, isAdmin, attractionsController.approveRecommendation);
router.post('/recommendations/:id/reject', authenticate, isAdmin, attractionsController.rejectRecommendation);

// BARU: Create (Direct) & Delete
router.post('/', authenticate, isAdmin, attractionsController.createAttraction);
router.delete('/:id', authenticate, isAdmin, attractionsController.deleteAttraction);

module.exports = router;
