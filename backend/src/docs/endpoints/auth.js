/**
 * Documentation des endpoints d'authentification
 * @module AuthEndpoints
 */

module.exports = {
  /**
   * @api {post} /api/auth/register Inscription utilisateur
   * @apiName RegisterUser
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiBody {String} email Adresse email valide
   * @apiBody {String} password Mot de passe (min 8 caractères)
   * @apiBody {String} full_name Nom complet
   * @apiBody {String} [phone] Numéro de téléphone
   * @apiBody {String} [role=user] Rôle (user/seller/admin)
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} user Données de l'utilisateur créé
   * @apiSuccess {String} user.id ID de l'utilisateur
   * @apiSuccess {String} user.email Email de l'utilisateur
   * @apiSuccess {String} user.full_name Nom complet
   * @apiSuccess {String} user.role Rôle de l'utilisateur
   * @apiSuccess {String} token Token JWT d'authentification
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 201 Created
   * {
   *   "success": true,
   *   "user": {
   *     "id": "user-123",
   *     "email": "test@example.com",
   *     "full_name": "John Doe",
   *     "role": "user",
   *     "created_at": "2024-01-15T10:00:00.000Z"
   *   },
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * 
   * @apiError (400) ValidationError Données d'inscription invalides
   * @apiError (409) UserExists L'utilisateur existe déjà
   * 
   * @apiErrorExample {json} Error Response:
   * HTTP/1.1 400 Bad Request
   * {
   *   "success": false,
   *   "error": "Validation Error",
   *   "errors": {
   *     "email": "L'email est requis",
   *     "password": "Le mot de passe doit contenir au moins 8 caractères"
   *   }
   * }
   */
  register: {
    method: 'POST',
    path: '/api/auth/register',
    description: 'Inscription d\'un nouvel utilisateur',
    requiresAuth: false,
    rateLimit: 'strict'
  },

  /**
   * @api {post} /api/auth/login Connexion utilisateur
   * @apiName LoginUser
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiBody {String} email Adresse email
   * @apiBody {String} password Mot de passe
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} user Données de l'utilisateur
   * @apiSuccess {String} token Token JWT d'authentification
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "user": {
   *     "id": "user-123",
   *     "email": "test@example.com",
   *     "full_name": "John Doe",
   *     "role": "user"
   *   },
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   * 
   * @apiError (401) InvalidCredentials Email ou mot de passe incorrect
   * 
   * @apiErrorExample {json} Error Response:
   * HTTP/1.1 401 Unauthorized
   * {
   *   "success": false,
   *   "error": "Invalid credentials",
   *   "message": "Email ou mot de passe incorrect"
   * }
   */
  login: {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Connexion d\'un utilisateur',
    requiresAuth: false,
    rateLimit: 'strict'
  },

  /**
   * @api {post} /api/auth/forgot-password Mot de passe oublié
   * @apiName ForgotPassword
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiBody {String} email Adresse email
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {String} message Message de confirmation
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "message": "Email de réinitialisation envoyé"
   * }
   * 
   * @apiError (400) ValidationError Email invalide
   * @apiError (404) UserNotFound Utilisateur non trouvé
   */
  forgotPassword: {
    method: 'POST',
    path: '/api/auth/forgot-password',
    description: 'Demande de réinitialisation de mot de passe',
    requiresAuth: false,
    rateLimit: 'normal'
  },

  /**
   * @api {post} /api/auth/reset-password Réinitialisation mot de passe
   * @apiName ResetPassword
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiBody {String} token Token de réinitialisation
   * @apiBody {String} new_password Nouveau mot de passe
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {String} message Message de confirmation
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "message": "Mot de passe réinitialisé avec succès"
   * }
   * 
   * @apiError (400) InvalidToken Token invalide ou expiré
   */
  resetPassword: {
    method: 'POST',
    path: '/api/auth/reset-password',
    description: 'Réinitialisation du mot de passe',
    requiresAuth: false,
    rateLimit: 'normal'
  },

  /**
   * @api {get} /api/auth/me Profil utilisateur
   * @apiName GetProfile
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} user Données du profil utilisateur
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "user": {
   *     "id": "user-123",
   *     "email": "test@example.com",
   *     "full_name": "John Doe",
   *     "role": "user",
   *     "phone": "+221701234567",
   *     "avatar_url": "https://example.com/avatar.jpg",
   *     "created_at": "2024-01-15T10:00:00.000Z",
   *     "updated_at": "2024-01-15T10:00:00.000Z"
   *   }
   * }
   * 
   * @apiError (401) Unauthorized Token manquant ou invalide
   */
  getProfile: {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Récupération du profil utilisateur',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {put} /api/auth/profile Mise à jour profil
   * @apiName UpdateProfile
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiBody {String} [full_name] Nom complet
   * @apiBody {String} [phone] Numéro de téléphone
   * @apiBody {String} [avatar_url] URL de l'avatar
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {Object} user Profil utilisateur mis à jour
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "user": {
   *     "id": "user-123",
   *     "full_name": "John Doe Updated",
   *     "phone": "+221701234568",
   *     "updated_at": "2024-01-15T11:00:00.000Z"
   *   }
   * }
   */
  updateProfile: {
    method: 'PUT',
    path: '/api/auth/profile',
    description: 'Mise à jour du profil utilisateur',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {post} /api/auth/logout Déconnexion
   * @apiName Logout
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT (Bearer)
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {String} message Message de confirmation
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "message": "Déconnexion réussie"
   * }
   */
  logout: {
    method: 'POST',
    path: '/api/auth/logout',
    description: 'Déconnexion de l\'utilisateur',
    requiresAuth: true,
    rateLimit: 'normal'
  },

  /**
   * @api {post} /api/auth/refresh Rafraîchissement token
   * @apiName RefreshToken
   * @apiGroup Authentication
   * @apiVersion 1.0.0
   * 
   * @apiHeader {String} Authorization Token JWT expiré (Bearer)
   * 
   * @apiSuccess {Boolean} success Statut de la requête
   * @apiSuccess {String} token Nouveau token JWT
   * 
   * @apiSuccessExample {json} Success Response:
   * HTTP/1.1 200 OK
   * {
   *   "success": true,
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * }
   */
  refreshToken: {
    method: 'POST',
    path: '/api/auth/refresh',
    description: 'Rafraîchissement du token JWT',
    requiresAuth: true,
    rateLimit: 'normal'
  }
};
