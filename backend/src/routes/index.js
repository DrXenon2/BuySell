const express = require('express');
const router = express.Router();

// Import des routes
const authRoutes = require('./auth');
const userRoutes = require('./users');
const productRoutes = require('./products');
const categoryRoutes = require('./categories');
const orderRoutes = require('./orders');
const cartRoutes = require('./cart');
const paymentRoutes = require('./payments');
const reviewRoutes = require('./reviews');
const uploadRoutes = require('./uploads');
const adminRoutes = require('./admin');
const analyticsRoutes = require('./analytics');
const webhookRoutes = require('./webhooks');

// Routes de santé et informations
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API en bonne santé',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Montage des routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/payments', paymentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/uploads', uploadRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhookRoutes);

// Route 404 pour les endpoints API non trouvés
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint non trouvé',
    message: `L'endpoint ${req.method} ${req.originalUrl} n'existe pas`
  });
});

module.exports = router;
