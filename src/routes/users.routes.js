const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');
const { authenticate, isAdmin, isAdminOrOwner } = require('../middleware/auth');

// Public routes
router.post('/register', usersController.register);
router.post('/login', usersController.login);

// Protected routes
router.get('/profile', authenticate, usersController.getProfile);
router.put('/profile', authenticate, usersController.updateProfile);

// Admin routes
router.get('/', authenticate, isAdmin, usersController.getAllUsers);
router.get('/:id', authenticate, isAdminOrOwner, usersController.getUserById);
router.put('/:id', authenticate, isAdmin, usersController.updateUser);
router.delete('/:id', authenticate, isAdmin, usersController.deleteUser);

module.exports = router;