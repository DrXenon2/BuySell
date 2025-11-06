/**
 * Export centralisé de toutes les configurations
 */

// Configuration principale
export { APP_CONFIG, ENV_CONFIG } from './app';
export { default as appConfig } from './app';

// Routes
export { ROUTES, PROTECTED_ROUTES, ADMIN_ROUTES, SELLER_ROUTES, LOGIN_REDIRECTS } from './routes';
export { default as routes } from './routes';

// Supabase
export { SUPABASE_CONFIG, supabase, TABLES, STORAGE_BUCKETS, RLS_POLICIES } from './supabase';
export { default as supabaseConfig } from './supabase';

// Constantes
export {
  USER_ROLES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PAYMENT_STATUS,
  SHIPPING_METHODS,
  PRODUCT_TYPES,
  PRODUCT_CONDITIONS,
  MAIN_CATEGORIES,
  COUNTRIES,
  LANGUAGES,
  CURRENCIES,
  UPLOAD_LIMITS,
  VALIDATION_RULES,
  ERROR_CODES,
  ERROR_MESSAGES,
} from './constants';
export { default as constants } from './constants';

// Paramètres
export { APP_SETTINGS, DEFAULT_USER_SETTINGS, FEATURE_ACCESS } from './settings';
export { default as settings } from './settings';

// Pays
export { COUNTRIES as COUNTRIES_DATA, ADDRESS_FORMATS, getCountryByCode, getCountryCodes, getRegionsByCountry } from './countries';
export { default as countries } from './countries';

// Helper pour obtenir la configuration actuelle
export const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return {
    ...APP_CONFIG,
    ...ENV_CONFIG[env],
  };
};

// Helper pour vérifier une fonctionnalité
export const hasFeature = (feature) => {
  return APP_CONFIG.features[feature] === true;
};

// Helper pour vérifier l'accès par rôle
export const hasRoleAccess = (userRole, feature) => {
  const features = FEATURE_ACCESS[userRole] || [];
  return features.includes(feature);
};

export default {
  app: appConfig,
  routes,
  supabase: supabaseConfig,
  constants,
  settings,
  countries,
  getCurrentConfig,
  hasFeature,
  hasRoleAccess,
};
