/**
 * Configuration des routes de l'application
 */

export const ROUTES = {
  // Pages publiques
  public: {
    home: '/',
    products: '/products',
    productDetail: (id) => `/products/${id}`,
    categories: '/categories',
    category: (slug) => `/products/category/${slug}`,
    sellers: '/sellers',
    seller: (id) => `/sellers/${id}`,
    about: '/about',
    contact: '/contact',
    faq: '/faq',
    blog: '/blog',
  },

  // Authentification
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
    profile: '/profile',
  },

  // Panier et commandes
  cart: {
    cart: '/cart',
    checkout: '/checkout',
    checkoutShipping: '/checkout/shipping',
    checkoutPayment: '/checkout/payment',
    checkoutConfirmation: '/checkout/confirmation',
    orders: '/orders',
    orderDetail: (id) => `/orders/${id}`,
    orderTracking: (id) => `/orders/${id}/tracking`,
  },

  // Tableaux de bord
  dashboard: {
    main: '/dashboard',
    seller: {
      main: '/dashboard/seller',
      products: '/dashboard/seller/products',
      addProduct: '/dashboard/seller/products/new',
      editProduct: (id) => `/dashboard/seller/products/${id}/edit`,
      orders: '/dashboard/seller/orders',
      analytics: '/dashboard/seller/analytics',
      settings: '/dashboard/seller/settings',
    },
    admin: {
      main: '/dashboard/admin',
      users: '/dashboard/admin/users',
      products: '/dashboard/admin/products',
      categories: '/dashboard/admin/categories',
      orders: '/dashboard/admin/orders',
      analytics: '/dashboard/admin/analytics',
      settings: '/dashboard/admin/settings',
    },
  },

  // Profil utilisateur
  profile: {
    main: '/profile',
    orders: '/profile/orders',
    addresses: '/profile/addresses',
    wishlist: '/profile/wishlist',
    reviews: '/profile/reviews',
    settings: '/profile/settings',
  },

  // API Routes
  api: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      verifyEmail: '/api/auth/verify-email',
      profile: '/api/auth/profile',
    },
    products: {
      list: '/api/products',
      detail: (id) => `/api/products/${id}`,
      create: '/api/products',
      update: (id) => `/api/products/${id}`,
      delete: (id) => `/api/products/${id}`,
      search: '/api/products/search',
      categories: '/api/categories',
      reviews: (id) => `/api/products/${id}/reviews`,
    },
    cart: {
      get: '/api/cart',
      add: '/api/cart',
      update: '/api/cart',
      remove: (id) => `/api/cart/${id}`,
      clear: '/api/cart/clear',
    },
    orders: {
      list: '/api/orders',
      create: '/api/orders',
      detail: (id) => `/api/orders/${id}`,
      update: (id) => `/api/orders/${id}`,
      cancel: (id) => `/api/orders/${id}/cancel',
    },
    upload: {
      image: '/api/upload',
      multiple: '/api/upload/multiple',
    },
    search: {
      global: '/api/search',
      suggestions: '/api/search/suggestions',
      popular: '/api/search/popular',
    },
  },
};

// Routes protégées nécessitant une authentification
export const PROTECTED_ROUTES = [
  '/profile',
  '/cart',
  '/checkout',
  '/orders',
  '/dashboard',
  '/wishlist',
];

// Routes admin nécessitant des privilèges élevés
export const ADMIN_ROUTES = [
  '/dashboard/admin',
  '/dashboard/admin/users',
  '/dashboard/admin/products',
  '/dashboard/admin/categories',
  '/dashboard/admin/analytics',
];

// Routes vendeur
export const SELLER_ROUTES = [
  '/dashboard/seller',
  '/dashboard/seller/products',
  '/dashboard/seller/orders',
  '/dashboard/seller/analytics',
];

// Redirections après connexion
export const LOGIN_REDIRECTS = {
  default: '/',
  seller: '/dashboard/seller',
  admin: '/dashboard/admin',
};

export default ROUTES;
