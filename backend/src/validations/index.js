// Export centralisé de tous les schémas de validation
const authValidation = require('./authValidation');
const userValidation = require('./userValidation');
const productValidation = require('./productValidation');
const categoryValidation = require('./categoryValidation');
const orderValidation = require('./orderValidation');
const cartValidation = require('./cartValidation');
const reviewValidation = require('./reviewValidation');
const paymentValidation = require('./paymentValidation');
const addressValidation = require('./addressValidation');
const fileValidation = require('./fileValidation');

module.exports = {
  authValidation,
  userValidation,
  productValidation,
  categoryValidation,
  orderValidation,
  cartValidation,
  reviewValidation,
  paymentValidation,
  addressValidation,
  fileValidation
};
