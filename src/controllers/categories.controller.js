const db = require('../config/db');

exports.getAllCategories = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM categories ORDER BY name');
    res.status(200).json({
      status: 'success',
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};