/**
 * Utilitaires généraux et fonctions helper
 */

/**
 * Formate un prix avec la devise
 */
export const formatPrice = (price, currency = 'EUR', locale = 'fr-FR') => {
  if (price == null || isNaN(price)) return 'N/A';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};

/**
 * Formate une date
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Date(date).toLocaleDateString('fr-FR', defaultOptions);
};

/**
 * Formate une date relative (il y a...)
 */
export const formatRelativeTime = (date) => {
  const now = new Date();
  const target = new Date(date);
  const diffInMs = now - target;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInSeconds < 60) {
    return 'À l\'instant';
  } else if (diffInMinutes < 60) {
    return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
  } else if (diffInHours < 24) {
    return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInDays < 7) {
    return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInWeeks < 4) {
    return `Il y a ${diffInWeeks} semaine${diffInWeeks > 1 ? 's' : ''}`;
  } else if (diffInMonths < 12) {
    return `Il y a ${diffInMonths} mois`;
  } else {
    return `Il y a ${diffInYears} an${diffInYears > 1 ? 's' : ''}`;
  }
};

/**
 * Tronque un texte avec une limite de caractères
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + suffix;
};

/**
 * Génère un ID unique
 */
export const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `${prefix}${timestamp}${random}`;
};

/**
 * Capitalise la première lettre d'une chaîne
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Capitalise chaque mot d'une chaîne
 */
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => capitalize(txt));
};

/**
 * Convertit une chaîne en slug URL-friendly
 */
export const slugify = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9 -]/g, '') // Remove invalid chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
};

/**
 * Débounce une fonction
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
};

/**
 * Throttle une fonction
 */
export const throttle = (func, limit) => {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Clone profond d'un objet
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Fusionne deux objets profondément
 */
export const deepMerge = (target, source) => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  
  return output;
};

/**
 * Vérifie si une valeur est un objet
 */
export const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Supprime les valeurs null/undefined d'un objet
 */
export const removeEmptyValues = (obj) => {
  const cleaned = { ...obj };
  
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] == null || cleaned[key] === '') {
      delete cleaned[key];
    }
  });
  
  return cleaned;
};

/**
 * Obtient une valeur nested d'un objet par chemin
 */
export const getNestedValue = (obj, path, defaultValue = undefined) => {
  const travel = (regexp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj);
  
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  return result === undefined || result === obj ? defaultValue : result;
};

/**
 * Déstructure un objet avec des valeurs par défaut
 */
export const destructureWithDefaults = (obj, defaults) => {
  return { ...defaults, ...removeEmptyValues(obj) };
};

/**
 * Génère un tableau de nombres pour les paginations
 */
export const generatePaginationRange = (current, total, delta = 2) => {
  const range = [];
  const rangeWithDots = [];

  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - delta && i <= current + delta)
    ) {
      range.push(i);
    }
  }

  let prev = 0;
  for (const i of range) {
    if (prev && i - prev !== 1) {
      rangeWithDots.push('...');
    }
    rangeWithDots.push(i);
    prev = i;
  }

  return rangeWithDots;
};

/**
 * Calcule le pourcentage de réduction
 */
export const calculateDiscountPercentage = (originalPrice, salePrice) => {
  if (!originalPrice || !salePrice || originalPrice <= salePrice) return 0;
  
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
};

/**
 * Valide une URL
 */
export const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

/**
 * Extrait le domaine d'une URL
 */
export const extractDomain = (url) => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (_) {
    return null;
  }
};

/**
 * Convertit des bytes en format lisible
 */
export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Génère un dégradé de couleur
 */
export const generateGradient = (color1, color2, percentage = 50) => {
  return `linear-gradient(135deg, ${color1} 0%, ${color2} ${percentage}%, ${color1} 100%)`;
};

/**
 * Met en pause l'exécution
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Exécute une fonction avec retry
 */
export const retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await sleep(delay);
    return retry(fn, retries - 1, delay * 2);
  }
};

export default {
  formatPrice,
  formatDate,
  formatRelativeTime,
  truncateText,
  generateId,
  capitalize,
  capitalizeWords,
  slugify,
  debounce,
  throttle,
  deepClone,
  deepMerge,
  removeEmptyValues,
  getNestedValue,
  generatePaginationRange,
  calculateDiscountPercentage,
  isValidUrl,
  formatBytes,
  sleep,
  retry,
};
