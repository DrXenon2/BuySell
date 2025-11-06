const client = require('prom-client');
const responseTime = require('response-time');

// Création d'un registry pour les métriques
const register = new client.Registry();

// Configuration des métriques par défaut
client.collectDefaultMetrics({
  register,
  prefix: 'app_',
  timeout: 5000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

// ==================== MÉTRIQUES HTTP ====================

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Durée des requêtes HTTP en ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status']
});

const httpRequestSizeBytes = new client.Histogram({
  name: 'http_request_size_bytes',
  help: 'Taille des requêtes HTTP en bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000]
});

const httpResponseSizeBytes = new client.Histogram({
  name: 'http_response_size_bytes',
  help: 'Taille des réponses HTTP en bytes',
  labelNames: ['method', 'route', 'status'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000, 500000]
});

// ==================== MÉTRIQUES APPLICATION ====================

const activeUsersGauge = new client.Gauge({
  name: 'app_active_users',
  help: 'Nombre d\'utilisateurs actifs',
  labelNames: ['type'] // authenticated, guest, etc.
});

const concurrentRequestsGauge = new client.Gauge({
  name: 'app_concurrent_requests',
  help: 'Nombre de requêtes concurrentes'
});

const databaseConnectionPool = new client.Gauge({
  name: 'app_db_connections',
  help: 'Statut des connexions base de données',
  labelNames: ['state'] // active, idle, waiting
});

// ==================== MÉTRIQUES BUSINESS ====================

const ordersCounter = new client.Counter({
  name: 'app_orders_total',
  help: 'Nombre total de commandes',
  labelNames: ['status', 'payment_method', 'currency']
});

const revenueCounter = new client.Counter({
  name: 'app_revenue_total',
  help: 'Revenu total en cents',
  labelNames: ['currency', 'payment_method']
});

const productsGauge = new client.Gauge({
  name: 'app_products_total',
  help: 'Nombre total de produits',
  labelNames: ['status', 'category']
});

const usersGauge = new client.Gauge({
  name: 'app_users_total',
  help: 'Nombre total d\'utilisateurs',
  labelNames: ['type', 'status']
});

const cartOperationsCounter = new client.Counter({
  name: 'app_cart_operations_total',
  help: 'Opérations sur le panier',
  labelNames: ['operation', 'status'] // add, remove, update, clear
});

const paymentTransactionsCounter = new client.Counter({
  name: 'app_payment_transactions_total',
  help: 'Transactions de paiement',
  labelNames: ['gateway', 'status', 'currency']
});

const productStockGauge = new client.Gauge({
  name: 'app_product_stock',
  help: 'Stock actuel des produits',
  labelNames: ['product_id', 'product_name', 'category']
});

const searchQueriesCounter = new client.Counter({
  name: 'app_search_queries_total',
  help: 'Requêtes de recherche',
  labelNames: ['type', 'category', 'results_count']
});

// ==================== MÉTRIQUES PERFORMANCE ====================

const databaseQueryDuration = new client.Histogram({
  name: 'app_db_query_duration_ms',
  help: 'Durée des requêtes base de données en ms',
  labelNames: ['operation', 'table', 'success'],
  buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
});

const cacheOperationsCounter = new client.Counter({
  name: 'app_cache_operations_total',
  help: 'Opérations de cache',
  labelNames: ['operation', 'type', 'status'] // get, set, delete, hit, miss
});

const externalApiCallDuration = new client.Histogram({
  name: 'app_external_api_call_duration_ms',
  help: 'Durée des appels API externes en ms',
  labelNames: ['service', 'endpoint', 'status'],
  buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000, 10000]
});

const fileUploadDuration = new client.Histogram({
  name: 'app_file_upload_duration_ms',
  help: 'Durée des uploads de fichiers en ms',
  labelNames: ['type', 'size_category', 'success'],
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 30000, 60000]
});

// ==================== ENREGISTREMENT DES MÉTRIQUES ====================

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestSizeBytes);
register.registerMetric(httpResponseSizeBytes);
register.registerMetric(activeUsersGauge);
register.registerMetric(concurrentRequestsGauge);
register.registerMetric(databaseConnectionPool);
register.registerMetric(ordersCounter);
register.registerMetric(revenueCounter);
register.registerMetric(productsGauge);
register.registerMetric(usersGauge);
register.registerMetric(cartOperationsCounter);
register.registerMetric(paymentTransactionsCounter);
register.registerMetric(productStockGauge);
register.registerMetric(searchQueriesCounter);
register.registerMetric(databaseQueryDuration);
register.registerMetric(cacheOperationsCounter);
register.registerMetric(externalApiCallDuration);
register.registerMetric(fileUploadDuration);

// ==================== MIDDLEWARE ET UTILITAIRES ====================

let concurrentRequests = 0;

/**
 * Middleware pour tracker les métriques HTTP
 */
const metricsMiddleware = responseTime((req, res, time) => {
  const route = req.route?.path || req.path;
  const method = req.method;
  const status = res.statusCode;
  const contentLength = parseInt(res.get('Content-Length') || '0', 10);

  // Métriques de durée
  httpRequestDurationMicroseconds
    .labels(method, route, status)
    .observe(time);

  // Métriques de compteur
  httpRequestsTotal
    .labels(method, route, status)
    .inc();

  // Métriques de taille de réponse
  if (contentLength) {
    httpResponseSizeBytes
      .labels(method, route, status)
      .observe(contentLength);
  }

  // Métriques de taille de requête
  const requestSize = parseInt(req.get('Content-Length') || '0', 10);
  if (requestSize) {
    httpRequestSizeBytes
      .labels(method, route)
      .observe(requestSize);
  }
});

/**
 * Middleware pour les requêtes concurrentes
 */
const concurrentRequestsMiddleware = (req, res, next) => {
  concurrentRequests++;
  concurrentRequestsGauge.set(concurrentRequests);

  res.on('finish', () => {
    concurrentRequests--;
    concurrentRequestsGauge.set(concurrentRequests);
  });

  next();
};

/**
 * Route pour exposer les métriques Prometheus
 */
const metricsRoute = async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).json({ 
      error: 'Failed to generate metrics',
      details: error.message 
    });
  }
};

/**
 * Utilitaire pour tracker les commandes
 */
const trackOrder = (orderData) => {
  const { id, status, total, currency, payment_method } = orderData;
  
  ordersCounter
    .labels(status, payment_method, currency)
    .inc();
  
  if (total && currency) {
    revenueCounter
      .labels(currency, payment_method)
      .inc(total);
  }
};

/**
 * Utilitaire pour tracker les produits
 */
const trackProduct = (productData) => {
  const { id, name, stock, category, status = 'active' } = productData;
  
  if (stock !== undefined) {
    productStockGauge
      .labels(id.toString(), name, category)
      .set(stock);
  }
};

/**
 * Utilitaire pour tracker les utilisateurs
 */
const trackUser = (userData) => {
  const { id, type = 'customer', status = 'active' } = userData;
  
  usersGauge
    .labels(type, status)
    .inc();
};

/**
 * Utilitaire pour tracker les opérations panier
 */
const trackCartOperation = (operation, status = 'success') => {
  cartOperationsCounter
    .labels(operation, status)
    .inc();
};

/**
 * Utilitaire pour tracker les paiements
 */
const trackPayment = (paymentData) => {
  const { id, gateway, status, amount, currency } = paymentData;
  
  paymentTransactionsCounter
    .labels(gateway, status, currency)
    .inc();
};

/**
 * Utilitaire pour tracker les recherches
 */
const trackSearch = (searchData) => {
  const { query, type = 'product', category, results_count = 0 } = searchData;
  
  searchQueriesCounter
    .labels(type, category, results_count > 0 ? 'with_results' : 'no_results')
    .inc();
};

/**
 * Utilitaire pour tracker les requêtes base de données
 */
const trackDatabaseQuery = (operation, table, duration, success = true) => {
  databaseQueryDuration
    .labels(operation, table, success.toString())
    .observe(duration);
};

/**
 * Utilitaire pour tracker les opérations cache
 */
const trackCacheOperation = (operation, type, status) => {
  cacheOperationsCounter
    .labels(operation, type, status)
    .inc();
};

/**
 * Utilitaire pour tracker les appels API externes
 */
const trackExternalApiCall = (service, endpoint, duration, status) => {
  externalApiCallDuration
    .labels(service, endpoint, status)
    .observe(duration);
};

/**
 * Utilitaire pour tracker les uploads de fichiers
 */
const trackFileUpload = (type, size, duration, success = true) => {
  const sizeCategory = getSizeCategory(size);
  fileUploadDuration
    .labels(type, sizeCategory, success.toString())
    .observe(duration);
};

/**
 * Catégorisation de la taille des fichiers
 */
const getSizeCategory = (size) => {
  if (size < 1024 * 1024) return 'small'; // < 1MB
  if (size < 10 * 1024 * 1024) return 'medium'; // < 10MB
  if (size < 100 * 1024 * 1024) return 'large'; // < 100MB
  return 'xlarge'; // >= 100MB
};

/**
 * Mise à jour des utilisateurs actifs
 */
const updateActiveUsers = (authenticatedCount = 0, guestCount = 0) => {
  activeUsersGauge.labels('authenticated').set(authenticatedCount);
  activeUsersGauge.labels('guest').set(guestCount);
};

/**
 * Mise à jour des connexions base de données
 */
const updateDatabaseConnections = (active = 0, idle = 0, waiting = 0) => {
  databaseConnectionPool.labels('active').set(active);
  databaseConnectionPool.labels('idle').set(idle);
  databaseConnectionPool.labels('waiting').set(waiting);
};

/**
 * Reset des métriques (pour les tests)
 */
const resetMetrics = async () => {
  register.resetMetrics();
};

// ==================== EXPORTS ====================

module.exports = {
  // Registry et client
  register,
  client,
  
  // Middlewares
  metricsMiddleware,
  concurrentRequestsMiddleware,
  metricsRoute,
  
  // Métriques individuelles
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  ordersCounter,
  revenueCounter,
  productsGauge,
  usersGauge,
  cartOperationsCounter,
  paymentTransactionsCounter,
  productStockGauge,
  searchQueriesCounter,
  databaseQueryDuration,
  cacheOperationsCounter,
  externalApiCallDuration,
  fileUploadDuration,
  
  // Utilitaires de tracking
  trackOrder,
  trackProduct,
  trackUser,
  trackCartOperation,
  trackPayment,
  trackSearch,
  trackDatabaseQuery,
  trackCacheOperation,
  trackExternalApiCall,
  trackFileUpload,
  
  // Utilitaires de mise à jour
  updateActiveUsers,
  updateDatabaseConnections,
  
  // Utilitaires divers
  resetMetrics,
  getSizeCategory
};
