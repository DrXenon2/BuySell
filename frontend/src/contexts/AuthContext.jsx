'use client';

import { createContext, useContext, useReducer, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const AuthContext = createContext();

// Actions
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOGOUT: 'LOGOUT'
};

// Reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: action.payload ? state.error : null
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isLoading: false,
        error: null
      };

    default:
      return state;
  }
}

// Hook personnalisé
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    error: null
  });

  const { notify } = useNotification();

  // Vérifier la session au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

        // Vérifier le token dans le localStorage
        const token = localStorage.getItem('auth-token');
        const userData = localStorage.getItem('auth-user');

        if (token && userData) {
          const user = JSON.parse(userData);
          
          // Valider le token avec le backend
          const response = await fetch('/api/auth/verify', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: user });
          } else {
            // Token invalide, déconnecter
            localStorage.removeItem('auth-token');
            localStorage.removeItem('auth-user');
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        dispatch({ type: AUTH_ACTIONS.SET_USER, payload: null });
      }
    };

    checkAuth();
  }, []);

  // Connexion
  const signIn = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur de connexion');
      }

      // Sauvegarder le token et les données utilisateur
      localStorage.setItem('auth-token', data.data.tokens.accessToken);
      localStorage.setItem('auth-user', JSON.stringify(data.data.user));

      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: data.data.user });

      notify.success('Connexion réussie', 'Bienvenue !');
      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error.message || 'Erreur de connexion';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      notify.error('Erreur de connexion', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Inscription
  const signUp = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }

      // Sauvegarder le token et les données utilisateur
      localStorage.setItem('auth-token', data.data.tokens.accessToken);
      localStorage.setItem('auth-user', JSON.stringify(data.data.user));

      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: data.data.user });

      notify.success('Inscription réussie', 'Votre compte a été créé avec succès');
      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error.message || 'Erreur lors de l\'inscription';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      notify.error('Erreur d\'inscription', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Déconnexion
  const signOut = async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      // Appeler l'API de déconnexion
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      // Supprimer les données locales
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('buy-sell-cart'); // Vider aussi le panier

      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      notify.success('Déconnexion', 'Vous avez été déconnecté avec succès');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Forcer la déconnexion même en cas d'erreur
      localStorage.removeItem('auth-token');
      localStorage.removeItem('auth-user');
      localStorage.removeItem('buy-sell-cart');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: true };
    }
  };

  // Mot de passe oublié
  const forgotPassword = async (email) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la demande de réinitialisation');
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      notify.success('Email envoyé', 'Consultez votre boîte mail pour réinitialiser votre mot de passe');
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Erreur réseau';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      notify.error('Erreur', errorMessage);
      throw error;
    }
  };

  // Réinitialisation du mot de passe
  const resetPassword = async (token, newPassword) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password: newPassword
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      notify.success('Mot de passe réinitialisé', 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe');
      return data;
    } catch (error) {
      const errorMessage = error.message || 'Erreur réseau';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      notify.error('Erreur', errorMessage);
      throw error;
    }
  };

  // Mettre à jour le profil
  const updateProfile = async (updates) => {
    try {
      if (!state.user) {
        throw new Error('Utilisateur non connecté');
      }

      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour l'état local
      const updatedUser = { ...state.user, ...updates };
      localStorage.setItem('auth-user', JSON.stringify(updatedUser));
      dispatch({ type: AUTH_ACTIONS.SET_USER, payload: updatedUser });

      notify.success('Profil mis à jour', 'Vos informations ont été sauvegardées');
      return { success: true, data: data.data };
    } catch (error) {
      const errorMessage = error.message || 'Erreur lors de la mise à jour';
      dispatch({ type: AUTH_ACTIONS.SET_ERROR, payload: errorMessage });
      notify.error('Erreur', errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Rafraîchir le token
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      });

      const data = await response.json();

      if (data.success && data.data.accessToken) {
        localStorage.setItem('auth-token', data.data.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  };

  // Vérifier les rôles
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  const isAuthenticated = !!state.user;

  const value = {
    // State
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,

    // Actions
    signIn,
    signUp,
    signOut,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshToken,
    hasRole,
    isAuthenticated,

    // Méthodes utilitaires
    clearError: () => dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
