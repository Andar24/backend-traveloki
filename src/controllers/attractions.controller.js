// src/controllers/attractions.controller.js
const Attraction = require('../models/attraction.model');

// === PUBLIC READ ===

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
    if (!lat || !lng) return res.status(400).json({ status: 'error', message: 'Lat/Lng required' });
    const nearby = await Attraction.getByCoordinates(parseFloat(lat), parseFloat(lng), radius || 5);
    res.json({ status: 'success', count: nearby.length, data: nearby });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.getAttractionById = async (req, res) => {
  try {
    const attraction = await Attraction.findById(req.params.id);
    if (!attraction) return res.status(404).json({ status: 'error', message: 'Not found' });
    res.json({ status: 'success', data: attraction });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// === USER RECOMMENDATION ===

exports.submitRecommendation = async (req, res) => {
  try {
    const { name, description, lat, lng, address, category } = req.body;
    const payload = {
      name, description, lat, lng, address, category,
      submitted_by: req.user ? req.user.id : null
    };
    const newRec = await Attraction.createRecommendation(payload);
    res.status(201).json({ status: 'success', message: 'Terkirim! Menunggu verifikasi admin.', data: newRec });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// === ADMIN ACTIONS ===

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
    const catId = req.body.category_id || 1; 
    const result = await Attraction.approveRecommendation(id, catId, req.user.id);
    
    if (result.success) {
      res.json({ status: 'success', message: 'Disetujui!', data: result.attraction });
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
    res.json({ status: 'success', message: 'Ditolak.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Hapus Data
exports.deleteAttraction = async (req, res) => {
  try {
    const { id } = req.params;
    await Attraction.delete(id); 
    res.json({ status: 'success', message: 'Data berhasil dihapus permanen.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// FITUR BARU: CREATE (ADD) DIRECTLY
exports.createAttraction = async (req, res) => {
  try {
    const { name, description, lat, lng, address, category } = req.body;
    
    if (!name || !lat || !lng || !category) {
      return res.status(400).json({ status: 'error', message: 'Data wajib diisi (Nama, Lokasi, Kategori)' });
    }

    const newAttraction = await Attraction.create({
      name, description, lat, lng, address, category,
      submitted_by: req.user.id
    });

    res.status(201).json({
      status: 'success',
      message: 'Tempat wisata berhasil ditambahkan!',
      data: newAttraction
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

exports.updateAttraction = async (req, res) => { res.json({message: "Not implemented"}) };
