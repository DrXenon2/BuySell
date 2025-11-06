/**
 * Documentation des endpoints des catégories
 * @module CategoryEndpoints
 */

module.exports = {
  /**
   * @api {get} /api/categories Liste des catégories
   * @apiName GetCategories
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiQuery {Number} [page=1] Numéro de page
   * @apiQuery {Number} [limit=20] Nombre d'éléments par page
   * @apiQuery {String} [search] Recherche par nom
   * @apiQuery {String} [parent_id] Filtrer par catégorie parente
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object[]} data Liste des catégories
   * @apiSuccess {String} data.id ID de la catégorie
   * @apiSuccess {String} data.name Nom de la catégorie
   * @apiSuccess {String} data.slug Slug de la catégorie
   * @apiSuccess {String} data.description Description
   * @apiSuccess {String} data.image URL de l'image
   * @apiSuccess {String} data.parent_id ID de la catégorie parente
   * @apiSuccess {Number} data.product_count Nombre de produits
   * @apiSuccess {Object} pagination Informations de pagination
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": [
   *     {
   *       "id": "cat-123",
   *       "name": "Électronique",
   *       "slug": "electronique",
   *       "description": "Produits électroniques",
   *       "image": "https://example.com/electronics.jpg",
   *       "parent_id": null,
   *       "product_count": 150,
   *       "created_at": "2024-01-15T10:00:00.000Z"
   *     }
   *   ],
   *   "pagination": {
   *     "page": 1,
   *     "limit": 20,
   *     "total": 15,
   *     "pages": 1
   *   }
   * }
   */
  getCategories: {
    method: 'GET',
    path: '/api/categories',
    description: 'Récupérer la liste des catégories',
    requiresAuth: false,
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/categories/:id Détails catégorie
   * @apiName GetCategory
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiParam {String} id ID de la catégorie
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Détails de la catégorie
   * @apiSuccess {Object[]} data.subcategories Sous-catégories
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "data": {
   *     "id": "cat-123",
   *     "name": "Électronique",
   *     "slug": "electronique",
   *     "description": "Produits électroniques",
   *     "image": "https://example.com/electronics.jpg",
   *     "parent_id": null,
   *     "subcategories": [
   *       {
   *         "id": "cat-124",
   *         "name": "Smartphones",
   *         "slug": "smartphones",
   *         "product_count": 75
   *       }
   *     ],
   *     "product_count": 150,
   *     "created_at": "2024-01-15T10:00:00.000Z"
   *   }
   * }
   * 
   * @apiError (404) CategoryNotFound Catégorie non trouvée
   */
  getCategory: {
    method: 'GET',
    path: '/api/categories/:id',
    description: 'Récupérer les détails d\'une catégorie',
    requiresAuth: false,
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/categories/slug/:slug Catégorie par slug
   * @apiName GetCategoryBySlug
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiParam {String} slug Slug de la catégorie
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Détails de la catégorie
   */
  getCategoryBySlug: {
    method: 'GET',
    path: '/api/categories/slug/:slug',
    description: 'Récupérer une catégorie par son slug',
    requiresAuth: false,
    rateLimit: 'normal'
  },

  /**
   * @api {post} /api/categories Créer une catégorie
   * @apiName CreateCategory
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer) - Admin requis
   * 
   * @apiBody {String} name Nom de la catégorie
   * @apiBody {String} [description] Description
   * @apiBody {String} [image] URL de l'image
   * @apiBody {String} [parent_id] ID de la catégorie parente
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Catégorie créée
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 201 Created
   * {
   *   "success": true,
   *   "data": {
   *     "id": "cat-new",
   *     "name": "Nouvelle Catégorie",
   *     "slug": "nouvelle-categorie",
   *     "description": "Description de la nouvelle catégorie",
   *     "parent_id": null,
   *     "created_at": "2024-01-15T10:00:00.000Z"
   *   }
   * }
   * 
   * @apiError (400) ValidationError Données invalides
   * @apiError (401) Unauthorized Non authentifié
   * @apiError (403) Forbidden Droits insuffisants
   */
  createCategory: {
    method: 'POST',
    path: '/api/categories',
    description: 'Créer une nouvelle catégorie (Admin)',
    requiresAuth: true,
    requiredRole: 'admin',
    rateLimit: 'normal'
  },

  /**
   * @api {put} /api/categories/:id Mettre à jour une catégorie
   * @apiName UpdateCategory
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer) - Admin requis
   * 
   * @apiParam {String} id ID de la catégorie
   * 
   * @apiBody {String} [name] Nom de la catégorie
   * @apiBody {String} [description] Description
   * @apiBody {String} [image] URL de l'image
   * @apiBody {String} [parent_id] ID de la catégorie parente
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} data Catégorie mise à jour
   */
  updateCategory: {
    method: 'PUT',
    path: '/api/categories/:id',
    description: 'Mettre à jour une catégorie (Admin)',
    requiresAuth: true,
    requiredRole: 'admin',
    rateLimit: 'normal'
  },

  /**
   * @api {delete} /api/categories/:id Supprimer une catégorie
   * @apiName DeleteCategory
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer) - Admin requis
   * 
   * @apiParam {String} id ID de la catégorie
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {String} message Message de confirmation
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "message": "Catégorie supprimée avec succès"
   * }
   * 
   * @apiError (400) CategoryHasProducts Impossible de supprimer - catégorie contient des produits
   */
  deleteCategory: {
    method: 'DELETE',
    path: '/api/categories/:id',
    description: 'Supprimer une catégorie (Admin)',
    requiresAuth: true,
    requiredRole: 'admin',
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/categories/:id/products Produits d'une catégorie
   * @apiName GetCategoryProducts
   * @apiGroup Categories
   * @apiVersion 1.0.0
   * 
   * @apiParam {String} id ID de la catégorie
   * @apiQuery {Number} [page=1] Numéro de page
   * @apiQuery {Number} [limit=20] Nombre d'éléments par page
   * @apiQuery {String} [sort=created_at] Champ de tri
   * @apiQuery {String} [order=desc] Ordre de tri (asc/desc)
   * @apiQuery {Number} [min_price] Prix minimum
   * @apiQuery {Number} [max_price] Prix maximum
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object[]} data Liste des produits
   * @apiSuccess {Object} pagination Informations de pagination
   */
  getCategoryProducts: {
    method: 'GET',
    path: '/api/categories/:id/products',
    description: 'Récupérer les produits d\'une catégorie',
    requiresAuth: false,
    rateLimit: 'normal'
  }
};
