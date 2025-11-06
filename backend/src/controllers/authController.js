const supabase = require('../config/supabase');
const config = require('../config');
const logger = require('../utils/logger');
const { generateTokens, verifyToken } = require('../utils/auth');
const { validateEmail, validatePassword } = require('../utils/validators');

class AuthController {
  // Inscription
  async signup(req, res) {
    try {
      const { email, password, first_name, last_name, phone, role = 'customer' } = req.body;

      // Validation
      if (!validateEmail(email)) {
        return res.status(400).json({
          error: 'Email invalide',
          message: 'Veuillez fournir une adresse email valide'
        });
      }

      if (!validatePassword(password)) {
        return res.status(400).json({
          error: 'Mot de passe faible',
          message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
        });
      }

      // Vérifier si l'utilisateur existe déjà
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(409).json({
          error: 'Utilisateur existe déjà',
          message: 'Un compte avec cet email existe déjà'
        });
      }

      // Créer l'utilisateur dans Supabase Auth
      const { data: authData, error: authError } = await supabase.getClient().auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            phone,
            role
          }
        }
      });

      if (authError) {
        logger.error('Erreur inscription:', authError);
        return res.status(400).json({
          error: 'Erreur inscription',
          message: authError.message
        });
      }

      // Générer les tokens JWT
      const tokens = generateTokens(authData.user.id);

      logger.info('Nouvel utilisateur inscrit', { 
        userId: authData.user.id, 
        email,
        role 
      });

      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            first_name,
            last_name,
            role
          },
          tokens,
          requiresEmailVerification: !authData.user.email_confirmed_at
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur signup:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du compte'
      });
    }
  }

  // Connexion
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          error: 'Champs manquants',
          message: 'Email et mot de passe sont requis'
        });
      }

      // Authentifier avec Supabase
      const { data: authData, error: authError } = await supabase.getClient().auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        logger.warn('Tentative de connexion échouée:', { email, error: authError.message });
        
        if (authError.message === 'Invalid login credentials') {
          return res.status(401).json({
            error: 'Identifiants invalides',
            message: 'Email ou mot de passe incorrect'
          });
        }

        return res.status(400).json({
          error: 'Erreur connexion',
          message: authError.message
        });
      }

      // Vérifier si l'email est vérifié
      if (config.features.emailVerification && !authData.user.email_confirmed_at) {
        return res.status(403).json({
          error: 'Email non vérifié',
          message: 'Veuillez vérifier votre adresse email avant de vous connecter'
        });
      }

      // Générer les tokens
      const tokens = generateTokens(authData.user.id);

      // Mettre à jour le profil (last_login)
      await supabase
        .from('profiles')
        .update({ 
          last_login: new Date().toISOString(),
          login_count: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', authData.user.id);

      logger.info('Utilisateur connecté', { 
        userId: authData.user.id, 
        email 
      });

      res.json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: {
            id: authData.user.id,
            email: authData.user.email,
            email_verified: !!authData.user.email_confirmed_at
          },
          tokens
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur login:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la connexion'
      });
    }
  }

  // Déconnexion
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        // Invalider le token (dans une liste noire Redis)
        // Cette partie dépend de votre implémentation de cache
      }

      await supabase.getClient().auth.signOut();

      logger.info('Utilisateur déconnecté', { userId: req.user?.id });

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });

    } catch (error) {
      logger.error('Erreur contrôleur logout:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la déconnexion'
      });
    }
  }

  // Rafraîchir le token
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          error: 'Token manquant',
          message: 'Le refresh token est requis'
        });
      }

      // Vérifier le refresh token
      const decoded = verifyToken(refresh_token, 'refresh');

      if (!decoded) {
        return res.status(401).json({
          error: 'Token invalide',
          message: 'Refresh token invalide ou expiré'
        });
      }

      // Générer de nouveaux tokens
      const tokens = generateTokens(decoded.userId);

      logger.info('Tokens rafraîchis', { userId: decoded.userId });

      res.json({
        success: true,
        message: 'Tokens rafraîchis avec succès',
        data: { tokens }
      });

    } catch (error) {
      logger.error('Erreur contrôleur refreshToken:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du rafraîchissement du token'
      });
    }
  }

  // Mot de passe oublié
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          error: 'Email manquant',
          message: 'L\'email est requis'
        });
      }

      const { error } = await supabase.getClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${config.app.frontendUrl}/auth/reset-password`
      });

      if (error) {
        logger.error('Erreur mot de passe oublié:', error);
        // Ne pas révéler si l'email existe ou non
      }

      // Toujours retourner le même message pour la sécurité
      logger.info('Demande réinitialisation mot de passe', { email });

      res.json({
        success: true,
        message: 'Si un compte avec cet email existe, un lien de réinitialisation a été envoyé'
      });

    } catch (error) {
      logger.error('Erreur contrôleur forgotPassword:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la demande de réinitialisation'
      });
    }
  }

  // Réinitialiser le mot de passe
  async resetPassword(req, res) {
    try {
      const { token, new_password } = req.body;

      if (!token || !new_password) {
        return res.status(400).json({
          error: 'Champs manquants',
          message: 'Le token et le nouveau mot de passe sont requis'
        });
      }

      if (!validatePassword(new_password)) {
        return res.status(400).json({
          error: 'Mot de passe faible',
          message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'
        });
      }

      const { error } = await supabase.getClient().auth.updateUser({
        password: new_password
      });

      if (error) {
        logger.error('Erreur réinitialisation mot de passe:', error);
        return res.status(400).json({
          error: 'Token invalide',
          message: 'Le token de réinitialisation est invalide ou expiré'
        });
      }

      logger.info('Mot de passe réinitialisé', { userId: req.user?.id });

      res.json({
        success: true,
        message: 'Mot de passe réinitialisé avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur resetPassword:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la réinitialisation du mot de passe'
      });
    }
  }

  // Vérifier l'email
  async verifyEmail(req, res) {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({
          error: 'Token manquant',
          message: 'Le token de vérification est requis'
        });
      }

      const { error } = await supabase.getClient().auth.verifyOtp({
        token_hash: token,
        type: 'email'
      });

      if (error) {
        logger.error('Erreur vérification email:', error);
        return res.status(400).json({
          error: 'Token invalide',
          message: 'Le token de vérification est invalide ou expiré'
        });
      }

      logger.info('Email vérifié', { userId: req.user?.id });

      res.json({
        success: true,
        message: 'Email vérifié avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur verifyEmail:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification de l\'email'
      });
    }
  }

  // Profil utilisateur
  async getProfile(req, res) {
    try {
      const userId = req.user.id;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_settings (*),
          seller_profiles (*)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      res.json({
        success: true,
        data: { profile }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getProfile:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du profil'
      });
    }
  }

  // Mettre à jour le profil
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      // Champs autorisés pour la mise à jour
      const allowedFields = [
        'first_name', 'last_name', 'phone', 'avatar_url', 
        'date_of_birth', 'gender', 'bio', 'location'
      ];

      const filteredData = Object.keys(updateData)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateData[key];
          return obj;
        }, {});

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(filteredData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      logger.info('Profil mis à jour', { userId });

      res.json({
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { profile }
      });

    } catch (error) {
      logger.error('Erreur contrôleur updateProfile:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la mise à jour du profil'
      });
    }
  }
}

module.exports = new AuthController();
