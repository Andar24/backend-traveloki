// src/routes/attractions.router.js
const express = require('express');
const router = express.Router();
const attractionsController = require('../controllers/attractions.controller');
const { authenticate, isAdmin } = require('../middleware/auth');

// Public
router.get('/', attractionsController.getAllAttractions);
router.get('/medan', attractionsController.getMedanAttractions);
router.get('/search', attractionsController.searchAttractions);
router.get('/nearby', attractionsController.getNearbyAttractions);
router.get('/:id', attractionsController.getAttractionById);

// User
router.post('/recommend', authenticate, attractionsController.submitRecommendation);

// Admin Routes
router.get('/recommendations/pending', authenticate, isAdmin, attractionsController.getPendingRecommendations);
router.post('/recommendations/:id/approve', authenticate, isAdmin, attractionsController.approveRecommendation);
router.post('/recommendations/:id/reject', authenticate, isAdmin, attractionsController.rejectRecommendation);

// BARU: Rute Delete
router.delete('/:id', authenticate, isAdmin, attractionsController.deleteAttraction);

module.exports = router;
