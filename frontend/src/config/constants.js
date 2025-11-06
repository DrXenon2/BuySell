/**
 * Constantes globales de l'application
 */

// Rôles utilisateur
export const USER_ROLES = {
  CUSTOMER: 'customer',
  SELLER: 'seller',
  ADMIN: 'admin',
  MODERATOR: 'moderator',
};

// Statuts de commande
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Méthodes de paiement
export const PAYMENT_METHODS = {
  CARD: 'card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
  ORANGE_MONEY: 'orange_money',
  MTN_MONEY: 'mtn_money',
  WAVE: 'wave',
};

// Statuts de paiement
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

// Méthodes de livraison
export const SHIPPING_METHODS = {
  STANDARD: 'standard',
  EXPRESS: 'express',
  PICKUP: 'pickup',
  SAME_DAY: 'same_day',
};

// Types de produits
export const PRODUCT_TYPES = {
  PHYSICAL: 'physical',
  DIGITAL: 'digital',
  SERVICE: 'service',
};

// Conditions des produits
export const PRODUCT_CONDITIONS = {
  NEW: 'new',
  USED: 'used',
  REFURBISHED: 'refurbished',
};

// Unités de mesure
export const MEASUREMENT_UNITS = {
  WEIGHT: {
    GRAM: 'g',
    KILOGRAM: 'kg',
    POUND: 'lb',
    OUNCE: 'oz',
  },
  LENGTH: {
    CENTIMETER: 'cm',
    METER: 'm',
    INCH: 'in',
    FOOT: 'ft',
  },
  VOLUME: {
    MILLILITER: 'ml',
    LITER: 'l',
    GALLON: 'gal',
  },
};

// Catégories principales (exemple)
export const MAIN_CATEGORIES = [
  { id: 1, name: 'Électronique', slug: 'electronique', icon: '📱' },
  { id: 2, name: 'Mode', slug: 'mode', icon: '👕' },
  { id: 3, name: 'Maison', slug: 'maison', icon: '🏠' },
  { id: 4, name: 'Sport', slug: 'sport', icon: '⚽' },
  { id: 5, name: 'Beauté', slug: 'beaute', icon: '💄' },
  { id: 6, name: 'Jardin', slug: 'jardin', icon: '🌿' },
  { id: 7, name: 'Automobile', slug: 'automobile', icon: '🚗' },
  { id: 8, name: 'Livres', slug: 'livres', icon: '📚' },
];

// Pays supportés
export const COUNTRIES = [
  { code: 'FR', name: 'France', phoneCode: '+33', currency: 'EUR' },
  { code: 'BE', name: 'Belgique', phoneCode: '+32', currency: 'EUR' },
  { code: 'CH', name: 'Suisse', phoneCode: '+41', currency: 'CHF' },
  { code: 'CA', name: 'Canada', phoneCode: '+1', currency: 'CAD' },
  { code: 'SN', name: 'Sénégal', phoneCode: '+221', currency: 'XOF' },
  { code: 'CI', name: "Côte d'Ivoire", phoneCode: '+225', currency: 'XOF' },
];

// Langues supportées
export const LANGUAGES = [
  { code: 'fr', name: 'Français', nativeName: 'Français' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'ar', name: 'العربية', nativeName: 'العربية' },
];

// Devises supportées
export const CURRENCIES = {
  EUR: { symbol: '€', name: 'Euro' },
  USD: { symbol: '$', name: 'US Dollar' },
  GBP: { symbol: '£', name: 'British Pound' },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar' },
  XOF: { symbol: 'CFA', name: 'West African CFA Franc' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc' },
};

// Limites d'upload
export const UPLOAD_LIMITS = {
  IMAGE: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    MAX_DIMENSIONS: { width: 4000, height: 4000 },
  },
  DOCUMENT: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  },
  AVATAR: {
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png'],
    RECOMMENDED_DIMENSIONS: { width: 200, height: 200 },
  },
};

// Paramètres de validation
export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Veuillez entrer une adresse email valide',
  },
  PASSWORD: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial',
  },
  PHONE: {
    pattern: /^\+?[\d\s\-\(\)]{10,}$/,
    message: 'Veuillez entrer un numéro de téléphone valide',
  },
  NAME: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-ZÀ-ÿ\s\-']+$/,
    message: 'Le nom doit contenir entre 2 et 50 caractères alphabétiques',
  },
  PRODUCT: {
    NAME: { minLength: 3, maxLength: 200 },
    DESCRIPTION: { minLength: 10, maxLength: 2000 },
    PRICE: { min: 0.01, max: 1000000 },
    STOCK: { min: 0, max: 10000 },
  },
};

// Codes d'erreur
export const ERROR_CODES = {
  // Erreurs d'authentification
  AUTH: {
    INVALID_CREDENTIALS: 'auth/invalid-credentials',
    USER_NOT_FOUND: 'auth/user-not-found',
    EMAIL_EXISTS: 'auth/email-already-exists',
    WEAK_PASSWORD: 'auth/weak-password',
    TOKEN_EXPIRED: 'auth/token-expired',
    UNAUTHORIZED: 'auth/unauthorized',
  },
  
  // Erreurs de validation
  VALIDATION: {
    INVALID_EMAIL: 'validation/invalid-email',
    INVALID_PHONE: 'validation/invalid-phone',
    REQUIRED_FIELD: 'validation/required-field',
    INVALID_LENGTH: 'validation/invalid-length',
  },
  
  // Erreurs de produits
  PRODUCTS: {
    NOT_FOUND: 'products/not-found',
    OUT_OF_STOCK: 'products/out-of-stock',
    INSUFFICIENT_STOCK: 'products/insufficient-stock',
    UNAUTHORIZED_ACCESS: 'products/unauthorized-access',
  },
  
  // Erreurs de commandes
  ORDERS: {
    NOT_FOUND: 'orders/not-found',
    INVALID_STATUS: 'orders/invalid-status',
    PAYMENT_FAILED: 'orders/payment-failed',
    CANCELLATION_FAILED: 'orders/cancellation-failed',
  },
  
  // Erreurs de paiement
  PAYMENTS: {
    FAILED: 'payments/failed',
    DECLINED: 'payments/declined',
    INSUFFICIENT_FUNDS: 'payments/insufficient-funds',
    NETWORK_ERROR: 'payments/network-error',
  },
};

// Messages d'erreur utilisateur
export const ERROR_MESSAGES = {
  [ERROR_CODES.AUTH.INVALID_CREDENTIALS]: 'Email ou mot de passe incorrect',
  [ERROR_CODES.AUTH.USER_NOT_FOUND]: 'Aucun compte trouvé avec cet email',
  [ERROR_CODES.AUTH.EMAIL_EXISTS]: 'Un compte existe déjà avec cet email',
  [ERROR_CODES.AUTH.WEAK_PASSWORD]: 'Le mot de passe est trop faible',
  [ERROR_CODES.AUTH.TOKEN_EXPIRED]: 'Votre session a expiré, veuillez vous reconnecter',
  [ERROR_CODES.AUTH.UNAUTHORIZED]: 'Accès non autorisé',
  
  [ERROR_CODES.PRODUCTS.NOT_FOUND]: 'Produit non trouvé',
  [ERROR_CODES.PRODUCTS.OUT_OF_STOCK]: 'Produit en rupture de stock',
  [ERROR_CODES.PRODUCTS.INSUFFICIENT_STOCK]: 'Stock insuffisant pour cette quantité',
  
  default: 'Une erreur est survenue. Veuillez réessayer.',
};

export default {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  COUNTRIES,
  LANGUAGES,
  CURRENCIES,
  VALIDATION_RULES,
  ERROR_CODES,
  ERROR_MESSAGES,
};
