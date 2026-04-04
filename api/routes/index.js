const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const doctorRoutes = require('./doctorRoutes');
const aiRoutes = require('./aiRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/doctor', doctorRoutes);
router.use('/ai', aiRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
