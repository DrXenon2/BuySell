// Constantes de l'application
module.exports = {
  // Rôles utilisateur
  USER_ROLES: {
    CUSTOMER: 'customer',
    SELLER: 'seller',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
  },

  // Statuts des commandes
  ORDER_STATUS: {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    PAYMENT_FAILED: 'payment_failed',
  },

  // Statuts des paiements
  PAYMENT_STATUS: {
    REQUIRES_PAYMENT_METHOD: 'requires_payment_method',
    REQUIRES_CONFIRMATION: 'requires_confirmation',
    REQUIRES_ACTION: 'requires_action',
    PROCESSING: 'processing',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELED: 'canceled',
  },

  // Types de réduction
  DISCOUNT_TYPES: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    FREE_SHIPPING: 'free_shipping',
  },

  // Priorités des notifications
  NOTIFICATION_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  // Types de notifications
  NOTIFICATION_TYPES: {
    WELCOME: 'WELCOME',
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_STATUS_UPDATED: 'ORDER_STATUS_UPDATED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    LOW_STOCK_ALERT: 'LOW_STOCK_ALERT',
    CRITICAL_STOCK_ALERT: 'CRITICAL_STOCK_ALERT',
    EMAIL_VERIFIED: 'EMAIL_VERIFIED',
    SECURITY_ALERT: 'SECURITY_ALERT',
    ANNOUNCEMENT: 'ANNOUNCEMENT',
  },

  // Méthodes de paiement
  PAYMENT_METHODS: {
    CARD: 'card',
    MOBILE_MONEY: 'mobile_money',
    BANK_TRANSFER: 'bank_transfer',
    ORANGE_MONEY: 'orange_money',
    WAVE: 'wave',
    CASH: 'cash',
  },

  // Options de livraison
  DELIVERY_OPTIONS: {
    STANDARD: 'standard',
    EXPRESS: 'express',
    PRIORITY: 'priority',
    STORE_PICKUP: 'store_pickup',
  },

  // Pays supportés
  COUNTRIES: {
    SN: 'Sénégal',
    CI: 'Côte d\'Ivoire',
    ML: 'Mali',
    BF: 'Burkina Faso',
    GN: 'Guinée',
    NE: 'Niger',
    TG: 'Togo',
    BJ: 'Bénin',
  },

  // Devises
  CURRENCIES: {
    XOF: 'XOF',
    EUR: 'EUR',
    USD: 'USD',
  },

  // Langues supportées
  LANGUAGES: {
    FR: 'fr',
    EN: 'en',
    AR: 'ar',
  },

  // Thèmes
  THEMES: {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto',
  },

  // Niveaux de confidentialité
  PRIVACY_LEVELS: {
    PUBLIC: 'public',
    PRIVATE: 'private',
    FRIENDS_ONLY: 'friends_only',
  },

  // Statuts des avis
  REVIEW_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  // Types d'événements d'audit
  AUDIT_ACTIONS: {
    USER_REGISTERED: 'USER_REGISTERED',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    PROFILE_UPDATED: 'PROFILE_UPDATED',
    PRODUCT_CREATED: 'PRODUCT_CREATED',
    PRODUCT_UPDATED: 'PRODUCT_UPDATED',
    PRODUCT_DELETED: 'PRODUCT_DELETED',
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_UPDATED: 'ORDER_UPDATED',
    ORDER_CANCELLED: 'ORDER_CANCELLED',
    PAYMENT_CREATED: 'PAYMENT_CREATED',
    PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    REVIEW_CREATED: 'REVIEW_CREATED',
    REVIEW_UPDATED: 'REVIEW_UPDATED',
  },

  // Limites et contraintes
  LIMITS: {
    MAX_PRODUCT_IMAGES: 10,
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_CART_ITEMS: 50,
    MAX_ORDER_ITEMS: 100,
    MAX_REVIEW_LENGTH: 1000,
    MAX_PRODUCT_TITLE: 200,
    MAX_PRODUCT_DESCRIPTION: 5000,
    MAX_USERNAME_LENGTH: 50,
    MIN_PASSWORD_LENGTH: 8,
  },

  // Formats de date
  DATE_FORMATS: {
    DATABASE: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY: 'DD/MM/YYYY HH:mm',
    SHORT: 'DD/MM/YYYY',
  },

  // Codes d'erreur HTTP personnalisés
  ERROR_CODES: {
    VALIDATION_ERROR: 422,
    RATE_LIMIT_EXCEEDED: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
  },

  // Messages d'erreur
  ERROR_MESSAGES: {
    UNAUTHORIZED: 'Accès non autorisé',
    FORBIDDEN: 'Accès interdit',
    NOT_FOUND: 'Ressource non trouvée',
    VALIDATION_ERROR: 'Erreur de validation',
    RATE_LIMIT_EXCEEDED: 'Limite de requêtes dépassée',
    INTERNAL_SERVER_ERROR: 'Erreur interne du serveur',
    SERVICE_UNAVAILABLE: 'Service temporairement indisponible',
  },

  // Configuration des taux et frais
  FEES: {
    SELLER_COMMISSION: 0.05, // 5% de commission
    TRANSACTION_FEE: 0.029, // 2.9% de frais de transaction
    FIXED_FEE: 0.30, // 0.30€ de frais fixes
    TAX_RATE: 0.18, // 18% de TVA
  },

  // Intervalles de temps (en millisecondes)
  TIME_INTERVALS: {
    ONE_MINUTE: 60 * 1000,
    FIVE_MINUTES: 5 * 60 * 1000,
    FIFTEEN_MINUTES: 15 * 60 * 1000,
    ONE_HOUR: 60 * 60 * 1000,
    ONE_DAY: 24 * 60 * 60 * 1000,
    ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  },
};
