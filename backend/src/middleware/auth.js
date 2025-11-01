const supabase = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Accès non autorisé',
        message: 'Token d\'authentification manquant'
      });
    }

    const token = authHeader.substring(7); // Retirer "Bearer "

    // Vérifier le token avec Supabase
    const { data: { user }, error } = await supabase.getClient().auth.getUser(token);

    if (error || !user) {
      logger.warn('Tentative d\'authentification avec token invalide:', { error: error?.message });
      return res.status(401).json({
        success: false,
        error: 'Token invalide',
        message: 'Session expirée ou invalide'
      });
    }

    // Vérifier si l'utilisateur est actif
    if (user.user_metadata?.is_active === false) {
      return res.status(403).json({
        success: false,
        error: 'Compte désactivé',
        message: 'Votre compte a été désactivé'
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'customer',
      is_verified: user.email_confirmed_at !== null,
      ...user.user_metadata
    };

    logger.debug('Utilisateur authentifié:', { 
      userId: user.id, 
      role: req.user.role,
      email: user.email 
    });
    next();

  } catch (error) {
    logger.error('Erreur d\'authentification:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur d\'authentification',
      message: 'Erreur lors de la vérification du token'
    });
  }
};

/**
 * Middleware d'autorisation par rôle
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié',
        message: 'Utilisateur non authentifié'
      });
    }

    // Convertir en tableau si c'est une string
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
      logger.warn('Tentative d\'accès non autorisé:', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: requiredRoles,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        success: false,
        error: 'Accès refusé',
        message: 'Vous n\'avez pas les permissions nécessaires pour cette action'
      });
    }

    next();
  };
};

/**
 * Middleware d'authentification optionnelle
 * Continue même si l'authentification échoue
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.getClient().auth.getUser(token);

      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'customer',
          is_verified: user.email_confirmed_at !== null,
          ...user.user_metadata
        };
        
        logger.debug('Authentification optionnelle réussie:', { userId: user.id });
      }
    }

    next();
  } catch (error) {
    // En cas d'erreur, continuer sans authentification
    logger.debug('Authentification optionnelle échouée, continuation sans utilisateur');
    next();
  }
};

/**
 * Middleware pour vérifier la propriété de la ressource
 */
const isOwnerOrAdmin = (resourceOwnerIdPath = 'params.userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non authentifié'
      });
    }

    // Évaluer le chemin pour obtenir l'ID du propriétaire
    const pathParts = resourceOwnerIdPath.split('.');
    let resourceOwnerId = req;
    
    for (const part of pathParts) {
      resourceOwnerId = resourceOwnerId[part];
      if (resourceOwnerId === undefined) break;
    }

    // Admin peut tout faire
    if (req.user.role === 'admin') {
      return next();
    }

    // Vérifier si l'utilisateur est le propriétaire
    if (resourceOwnerId && req.user.id === resourceOwnerId) {
      return next();
    }

    logger.warn('Tentative d\'accès à une ressource non autorisée:', {
      userId: req.user.id,
      resourceOwnerId,
      path: req.path
    });

    return res.status(403).json({
      success: false,
      error: 'Accès refusé',
      message: 'Vous ne pouvez accéder qu\'à vos propres ressources'
    });
  };
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  isOwnerOrAdmin
};
