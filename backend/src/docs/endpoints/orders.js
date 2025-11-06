/**
 * Documentation des endpoints des commandes
 * @module OrderEndpoints
 */

module.exports = {
  /**
   * @api {get} /api/orders Liste des commandes
   * @apiName GetOrders
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiQuery {Number} [page=1] Numéro de page
   * @apiQuery {Number} [limit=20] Nombre d'éléments par page
   * @apiQuery {String} [status] Filtrer par statut
   * @apiQuery {String} [sort=created_at] Champ de tri
   * @apiQuery {String} [order=desc] Ordre de tri
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object[]} data Liste des commandes
   * @apiSuccess {String} data.id ID de la commande
   * @apiSuccess {String} data.order_number Numéro de commande
   * @apiSuccess {Number} data.total_amount Montant total
   * @apiSuccess {String} data.status Statut de la commande
   * @apiSuccess {String} data.payment_status Statut du paiement
   * @apiSuccess {Object} data.shipping_address Adresse de livraison
   * @apiSuccess {Object} pagination Informations de pagination
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "order-123",
   *       "order_number": "BS-2024-001",
   *       "total_amount": 25000,
   *       "status": "delivered",
   *       "payment_status": "paid",
   *       "shipping_address": {
   *         "street": "123 Main St",
   *         "city": "Dakar",
   *         "country": "SN"
   *       },
   *       "created_at": "2024-01-15T10:00:00.000Z"
   *     }
   *   ],
   *   "pagination": {
   *     "page": 1,
   *     "limit": 20,
   *     "total": 5,
   *     "pages": 1
   *   }
   * }
   */
  getOrders: {
    method: 'GET',
    path: '/api/orders',
    description: 'Récupérer les commandes de l\'utilisateur',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/orders/:id Détails d'une commande
   * @apiName GetOrder
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiParam {String} id ID de la commande
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Détails de la commande
   * @apiSuccess {Object[]} data.items Articles de la commande
   * @apiSuccess {Object} data.shipping Adresse de livraison
   * @apiSuccess {Object} data.billing Adresse de facturation
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": {
   *     "id": "order-123",
   *     "order_number": "BS-2024-001",
   *     "total_amount": 25000,
   *     "status": "delivered",
   *     "payment_method": "orange_money",
   *     "payment_status": "paid",
   *     "items": [
   *       {
   *         "id": "item-123",
   *         "product_id": "prod-123",
   *         "product_name": "iPhone 13",
   *         "quantity": 1,
   *         "price": 25000,
   *         "total": 25000
   *       }
   *     ],
   *     "shipping_address": {
   *       "street": "123 Main St",
   *       "city": "Dakar",
   *       "country": "SN",
   *       "postal_code": "12500"
   *     },
   *     "tracking_number": "TRK123456789",
   *     "created_at": "2024-01-15T10:00:00.000Z"
   *   }
   * }
   * 
   * @apiError (404) OrderNotFound Commande non trouvée
   * @apiError (403) Forbidden Accès non autorisé à cette commande
   */
  getOrder: {
    method: 'GET',
    path: '/api/orders/:id',
    description: 'Récupérer les détails d\'une commande',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {post} /api/orders Créer une commande
   * @apiName CreateOrder
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiBody {Object[]} items Articles de la commande
   * @apiBody {String} items.product_id ID du produit
   * @apiBody {Number} items.quantity Quantité
   * @apiBody {Number} items.price Prix unitaire
   * @apiBody {Object} shipping_address Adresse de livraison
   * @apiBody {String} shipping_address.street Rue
   * @apiBody {String} shipping_address.city Ville
   * @apiBody {String} shipping_address.country Pays
   * @apiBody {String} shipping_address.postal_code Code postal
   * @apiBody {String} payment_method Méthode de paiement
   * @apiBody {Object} [billing_address] Adresse de facturation
   * @apiBody {String} [notes] Notes supplémentaires
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Commande créée
   * @apiSuccess {String} data.order_number Numéro de commande
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 201 Created
   * {
   *   "success": true,
   *   "data": {
   *     "id": "order-123",
   *     "order_number": "BS-2024-001",
   *     "total_amount": 25000,
   *     "status": "pending",
   *     "payment_status": "pending",
   *     "created_at": "2024-01-15T10:00:00.000Z"
   *   }
   * }
   * 
   * @apiError (400) ValidationError Données invalides
   * @apiError (400) OutOfStock Produit en rupture de stock
   */
  createOrder: {
    method: 'POST',
    path: '/api/orders',
    description: 'Créer une nouvelle commande',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {patch} /api/orders/:id/status Mettre à jour le statut
   * @apiName UpdateOrderStatus
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer) - Vendeur ou Admin
   * 
   * @apiParam {String} id ID de la commande
   * 
   * @apiBody {String} status Nouveau statut
   * @apiBody {String} [tracking_number] Numéro de suivi
   * @apiBody {String} [notes] Notes de mise à jour
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Commande mise à jour
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": {
   *     "id": "order-123",
   *     "status": "shipped",
   *     "tracking_number": "TRK123456789",
   *     "updated_at": "2024-01-15T11:00:00.000Z"
   *   }
   * }
   */
  updateOrderStatus: {
    method: 'PATCH',
    path: '/api/orders/:id/status',
    description: 'Mettre à jour le statut d\'une commande',
    requiresAuth: true,
    requiredRole: ['seller', 'admin'],
    rateLimit: 'normal'
  },

  /**
   * @api {post} /api/orders/:id/cancel Annuler une commande
   * @apiName CancelOrder
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiParam {String} id ID de la commande
   * 
   * @apiBody {String} [reason] Raison de l'annulation
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Commande annulée
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": {
   *     "id": "order-123",
   *     "status": "cancelled",
   *     "cancelled_at": "2024-01-15T11:00:00.000Z"
   *   }
   * }
   * 
   * @apiError (400) CannotCancel Impossible d'annuler la commande
   */
  cancelOrder: {
    method: 'POST',
    path: '/api/orders/:id/cancel',
    description: 'Annuler une commande',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/orders/:id/invoice Facture de commande
   * @apiName GetOrderInvoice
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiParam {String} id ID de la commande
   * 
   * @apiSuccess {File} invoice Fichier PDF de la facture
   * 
   * @apiError (404) OrderNotFound Commande non trouvée
   * @apiError (403) Forbidden Accès non autorisé
   */
  getOrderInvoice: {
    method: 'GET',
    path: '/api/orders/:id/invoice',
    description: 'Télécharger la facture d\'une commande',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/orders/tracking/:tracking_number Suivi de commande
   * @apiName TrackOrder
   * @apiGroup Orders
   * @apiVersion 1.0.0
   * 
   * @apiParam {String} tracking_number Numéro de suivi
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Informations de suivi
   * @apiSuccess {Object[]} data.events Événements de suivi
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": {
   *     "tracking_number": "TRK123456789",
   *     "status": "in_transit",
   *     "events": [
   *       {
   *         "date": "2024-01-15T10:00:00.000Z",
   *         "location": "Dakar Warehouse",
   *         "description": "Colis pris en charge"
   *       }
   *     ],
   *     "estimated_delivery": "2024-01-18T10:00:00.000Z"
   *   }
   * }
   */
  trackOrder: {
    method: 'GET',
    path: '/api/orders/tracking/:tracking_number',
    description: 'Suivre une commande par numéro de suivi',
    requiresAuth: false,
    rateLimit: 'normal'
  }
};
