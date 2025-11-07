/**
 * Configuration des routes de l'application
 */

const routes = {
  // Routes publiques
  public: {
    home: '/',
    products: '/products',
    productDetail: (id) => `/products/${id}`,
    categories: '/categories',
    categoryDetail: (slug) => `/categories/${slug}`,
    login: '/auth/login',
    register: '/auth/register',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password'
  },
  
  // Routes utilisateur
  user: {
    profile: '/user/profile',
    orders: '/user/orders',
    orderDetail: (id) => `/user/orders/${id}`,
    addresses: '/user/addresses',
    wishlist: '/user/wishlist',
    settings: '/user/settings'
  },
  
  // Routes vendeur
  seller: {
    dashboard: '/seller/dashboard',
    products: '/seller/products',
    createProduct: '/seller/products/create',
    editProduct: (id) => `/seller/products/${id}/edit`,
    orders: '/seller/orders',
    orderDetail: (id) => `/seller/orders/${id}`,
    analytics: '/seller/analytics',
    settings: '/seller/settings'
  },
  
  // Routes admin
  admin: {
    dashboard: '/admin/dashboard',
    users: '/admin/users',
    userDetail: (id) => `/admin/users/${id}`,
    products: '/admin/products',
    orders: '/admin/orders',
    categories: '/admin/categories',
    analytics: '/admin/analytics',
    settings: '/admin/settings'
  },
  
  // API routes
  api: {
    auth: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      logout: '/api/auth/logout',
      refresh: '/api/auth/refresh',
      forgotPassword: '/api/auth/forgot-password',
      resetPassword: '/api/auth/reset-password',
      verifyEmail: '/api/auth/verify-email'
    },
    users: {
      profile: '/api/users/profile',
      updateProfile: '/api/users/profile',
      addresses: '/api/users/addresses',
      wishlist: '/api/users/wishlist'
    },
    products: {
      list: '/api/products',
      get: (id) => `/api/products/${id}`,
      create: '/api/products',
      update: (id) => `/api/products/${id}`,
      delete: (id) => `/api/products/${id}`,
      search: '/api/products/search',
      categories: '/api/products/categories'
    },
    categories: {
      list: '/api/categories',
      get: (id) => `/api/categories/${id}`
    },
    orders: {
      list: '/api/orders',
      create: '/api/orders',
      get: (id) => `/api/orders/${id}`,
      update: (id) => `/api/orders/${id}`,
      cancel: (id) => `/api/orders/${id}/cancel`
    },
    cart: {
      get: '/api/cart',
      add: '/api/cart',
      update: (itemId) => `/api/cart/${itemId}`,
      remove: (itemId) => `/api/cart/${itemId}`,
      clear: '/api/cart'
    },
    payments: {
      createIntent: '/api/payments/create-intent',
      confirm: '/api/payments/confirm',
      history: '/api/payments/history'
    },
    uploads: {
      image: '/api/uploads/image',
      multiple: '/api/uploads/multiple',
      delete: '/api/uploads'
    }
  }
};

module.exports = routes;
