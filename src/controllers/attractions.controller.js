// src/controllers/attractions.controller.js
const Attraction = require('../models/attraction.model');

// === BAGIAN PUBLIC & USER ===

exports.getMedanAttractions = async (req, res) => {
  try {
    const rows = await Attraction.findAll(null, true);
    const groupedData = { food: [], fun: [], hotels: [] };

    rows.forEach(row => {
      const catName = row.category_name ? row.category_name.toLowerCase() : 'other';
      if (groupedData[catName]) {
        groupedData[catName].push({
          id: row.id,
          name: row.name,
          lat: parseFloat(row.lat),
          lng: parseFloat(row.lng),
          description: row.description,
          address: row.address,
          image: row.image_url || null,
          rating: row.rating
        });
      }
    });

    res.json({ status: 'success', data: groupedData });
  } catch (error) {
    console.error('Error getting attractions:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAllAttractions = async (req, res) => {
  try {
    const attractions = await Attraction.findAll(null, true);
    res.json({ status: 'success', count: attractions.length, data: attractions });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.searchAttractions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ status: 'error', message: 'Query param is required' });
    const results = await Attraction.searchByName(q);
    res.json({ status: 'success', count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getNearbyAttractions = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ status: 'error', message: 'Lat and Lng are required' });
    const nearby = await Attraction.getByCoordinates(parseFloat(lat), parseFloat(lng), radius ? parseFloat(radius) : 5);
    res.json({ status: 'success', count: nearby.length, data: nearby });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAttractionById = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id);
    if (!attraction) return res.status(404).json({ status: 'error', message: 'Attraction not found' });
    res.json({ status: 'success', data: attraction });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.submitRecommendation = async (req, res) => {
  try {
    const { name, description, lat, lng, address, category } = req.body;
    if (!name || !lat || !lng || !category) {
      return res.status(400).json({ status: 'error', message: 'Data tidak lengkap.' });
    }
    const payload = {
      name, description, lat, lng, address, category, 
      submitted_by: req.user ? req.user.id : null
    };
    const newRec = await Attraction.createRecommendation(payload);
    res.status(201).json({ status: 'success', message: 'Rekomendasi dikirim!', data: newRec });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// === BAGIAN ADMIN (BARU) ===

exports.getPendingRecommendations = async (req, res) => {
  try {
    const pendings = await Attraction.getPendingRecommendations();
    res.json({ status: 'success', data: pendings });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.approveRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    // Mapping kategori string ke ID (1=food, 2=fun, 3=hotels)
    const categoryMap = { 'food': 1, 'fun': 2, 'hotels': 3 };
    const catId = req.body.category_id || 1; // Default ke 1 jika tidak ada
    
    const result = await Attraction.approveRecommendation(id, catId, req.user.id);
    
    if (result.success) {
      res.json({ status: 'success', message: 'Rekomendasi disetujui!', data: result.attraction });
    } else {
      res.status(400).json({ status: 'error', message: result.message });
    }
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.rejectRecommendation = async (req, res) => {
  try {
    const { id } = req.params;
    await Attraction.rejectRecommendation(id, req.user.id);
    res.json({ status: 'success', message: 'Rekomendasi ditolak.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Stub functions
exports.createAttraction = async (req, res) => { res.json({message: "Not implemented"}) };
exports.updateAttraction = async (req, res) => { res.json({message: "Not implemented"}) };
exports.deleteAttraction = async (req, res) => { res.json({message: "Not implemented"}) };