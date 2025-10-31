const authController = require('./authController');
const userController = require('./userController');
const productController = require('./productController');
const categoryController = require('./categoryController');
const cartController = require('./cartController');
const orderController = require('./orderController');
const paymentController = require('./paymentController');
const reviewController = require('./reviewController');
const adminController = require('./adminController');
const analyticsController = require('./analyticsController');
const uploadController = require('./uploadController');
const webhookController = require('./webhookController');

module.exports = {
  authController,
  userController,
  productController,
  categoryController,
  cartController,
  orderController,
  paymentController,
  reviewController,
  adminController,
  analyticsController,
  uploadController,
  webhookController
};
