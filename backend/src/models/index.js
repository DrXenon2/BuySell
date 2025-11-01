// Export centralisé de tous les modèles
const User = require('./User');
const Profile = require('./Profile');
const Product = require('./Product');
const Category = require('./Category');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Cart = require('./Cart');
const CartItem = require('./CartItem');
const Review = require('./Review');
const Address = require('./Address');
const Payment = require('./Payment');
const Notification = require('./Notification');
const Settings = require('./Settings');
const Coupon = require('./Coupon');
const Wishlist = require('./Wishlist');

module.exports = {
  User,
  Profile,
  Product,
  Category,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Review,
  Address,
  Payment,
  Notification,
  Settings,
  Coupon,
  Wishlist
};
