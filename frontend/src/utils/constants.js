/**
 * Application constants
 */

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  REGISTER: '/api/auth/register',
  LOGOUT: '/api/auth/logout',
  REFRESH_TOKEN: '/api/auth/refresh',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  
  // Users
  USERS: '/api/users',
  USER_PROFILE: '/api/users/profile',
  USER_ADDRESSES: '/api/users/addresses',
  
  // Products
  PRODUCTS: '/api/products',
  PRODUCT_CATEGORIES: '/api/categories',
  PRODUCT_SEARCH: '/api/products/search',
  PRODUCT_REVIEWS: '/api/products/reviews',
  
  // Orders
  ORDERS: '/api/orders',
  ORDER_CREATE: '/api/orders/create',
  ORDER_TRACKING: '/api/orders/tracking',
  
  // Cart
  CART: '/api/cart',
  CART_ITEMS: '/api/cart/items',
  
  // Payments
  PAYMENTS: '/api/payments',
  PAYMENT_INTENT: '/api/payments/create-intent',
  PAYMENT_CONFIRM: '/api/payments/confirm',
  
  // Uploads
  UPLOAD: '/api/upload',
  UPLOAD_AVATAR: '/api/upload/avatar',
  UPLOAD_PRODUCT: '/api/upload/product',
};

// Application routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/[id]',
  CATEGORY: '/category/[slug]',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // User routes
  PROFILE: '/profile',
  ORDERS: '/profile/orders',
  ORDER_DETAIL: '/profile/orders/[id]',
  ADDRESSES: '/profile/addresses',
  WISHLIST: '/profile/wishlist',
  SETTINGS: '/profile/settings',
  
  // Checkout routes
  CART: '/cart',
  CHECKOUT: '/checkout',
  CHECKOUT_SHIPPING: '/checkout/shipping',
  CHECKOUT_PAYMENT: '/checkout/payment',
  CHECKOUT_CONFIRMATION: '/checkout/confirmation',
  
  // Dashboard routes
  DASHBOARD: '/dashboard',
  SELLER_DASHBOARD: '/dashboard/seller',
  SELLER_PRODUCTS: '/dashboard/seller/products',
  SELLER_ORDERS: '/dashboard/seller/orders',
  SELLER_ANALYTICS: '/dashboard/seller/analytics',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_CATEGORIES: '/admin/categories',
  ADMIN_ANALYTICS: '/admin/analytics',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  USER: 'user',
  GUEST: 'guest',
};

// Product categories
export const PRODUCT_CATEGORIES = {
  ELECTRONICS: 'electronics',
  FASHION: 'fashion',
  HOME: 'home',
  BEAUTY: 'beauty',
  SPORTS: 'sports',
  BOOKS: 'books',
  AUTOMOTIVE: 'automotive',
  TOYS: 'toys',
  OTHER: 'other',
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Payment methods
export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  ORANGE_MONEY: 'orange_money',
  MTN_MONEY: 'mtn_money',
  WAVE: 'wave',
  CASH: 'cash',
};

// Shipping methods
export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  PICKUP: 'pickup',
};

// Countries for address forms
export const COUNTRIES = [
  { code: 'SN', name: 'Sénégal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'CM', name: 'Cameroun' },
  { code: 'ML', name: 'Mali' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'GN', name: 'Guinée' },
  { code: 'NE', name: 'Niger' },
  { code: 'TG', name: 'Togo' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'FR', name: 'France' },
  { code: 'US', name: 'United States' },
];

// Currencies
export const CURRENCIES = {
  XOF: { symbol: 'CFA', name: 'Franc CFA' },
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
};

// File upload constraints
export const FILE_CONSTRAINTS = {
  MAX_FILE_SIZE: 5, // MB
  ALLOWED_IMAGE_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif'
  ],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  LIMIT_OPTIONS: [12, 24, 36, 48],
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  CART_ITEMS: 'cart_items',
  THEME_PREFERENCE: 'theme_preference',
  LANGUAGE: 'language',
};

// Theme constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Language constants
export const LANGUAGES = {
  FR: 'fr',
  EN: 'en',
  AR: 'ar',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
  UNAUTHORIZED: 'Vous devez être connecté pour accéder à cette ressource.',
  FORBIDDEN: "Vous n'avez pas la permission d'accéder à cette ressource.",
  NOT_FOUND: 'La ressource demandée est introuvable.',
  SERVER_ERROR: 'Erreur interne du serveur. Veuillez réessayer plus tard.',
  VALIDATION_ERROR: 'Veuillez vérifier les informations saisies.',
  TIMEOUT_ERROR: 'La requête a expiré. Veuillez réessayer.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: 'Profil mis à jour avec succès.',
  PASSWORD_CHANGED: 'Mot de passe modifié avec succès.',
  ORDER_CREATED: 'Commande créée avec succès.',
  PAYMENT_SUCCESS: 'Paiement effectué avec succès.',
  PRODUCT_ADDED: 'Produit ajouté avec succès.',
  CART_UPDATED: 'Panier mis à jour avec succès.',
};

// Breakpoints for responsive design
export const BREAKPOINTS = {
  XS: 0,
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  XXL: 1536,
};

// Animation durations
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Default images
export const DEFAULT_IMAGES = {
  AVATAR: '/images/avatars/default-avatar.png',
  PRODUCT: '/images/products/product-default.png',
  CATEGORY: '/images/categories/default-category.jpg',
};
