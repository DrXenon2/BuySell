// Utility helper functions

const { CURRENCIES, DATE_FORMATS } = require('./constants');

/**
 * Format a price amount with currency
 */
exports.formatPrice = (amount, currency = 'USD') => {
  const currencyInfo = CURRENCIES[currency] || CURRENCIES.USD;
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currencyInfo.decimalDigits,
    maximumFractionDigits: currencyInfo.decimalDigits,
  }).format(amount);

  return {
    amount,
    currency,
    formatted: formattedAmount,
    symbol: currencyInfo.symbol,
  };
};

/**
 * Generate a random string
 */
exports.generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate a unique ID
 */
exports.generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}${random}`.toLowerCase();
};

/**
 * Slugify a string
 */
exports.slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

/**
 * Truncate text with ellipsis
 */
exports.truncate = (text, length = 100, ellipsis = '...') => {
  if (text.length <= length) return text;
  return text.substr(0, length - ellipsis.length) + ellipsis;
};

/**
 * Deep clone an object
 */
exports.deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => exports.deepClone(item));
  if (obj instanceof Object) {
    const clonedObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = exports.deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
};

/**
 * Merge objects deeply
 */
exports.deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (exports.isObject(target) && exports.isObject(source)) {
    for (const key in source) {
      if (exports.isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        exports.deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return exports.deepMerge(target, ...sources);
};

/**
 * Check if value is an object
 */
exports.isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Check if value is empty
 */
exports.isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (exports.isObject(value)) return Object.keys(value).length === 0;
  return false;
};

/**
 * Format date
 */
exports.formatDate = (date, format = DATE_FORMATS.DISPLAY) => {
  const d = new Date(date);
  const options = {};

  switch (format) {
    case DATE_FORMATS.DISPLAY:
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    case DATE_FORMATS.DISPLAY_WITH_TIME:
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    case DATE_FORMATS.ISO:
      return d.toISOString();
    case DATE_FORMATS.DATABASE:
      return d.toISOString().slice(0, 19).replace('T', ' ');
    default:
      return d.toString();
  }
};

/**
 * Calculate distance between two dates
 */
exports.dateDiff = (date1, date2, unit = 'days') => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diff = Math.abs(d2 - d1);

  switch (unit) {
    case 'milliseconds':
      return diff;
    case 'seconds':
      return Math.floor(diff / 1000);
    case 'minutes':
      return Math.floor(diff / (1000 * 60));
    case 'hours':
      return Math.floor(diff / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diff / (1000 * 60 * 60 * 24));
    default:
      return diff;
  }
};

/**
 * Debounce function
 */
exports.debounce = (func, wait, immediate) => {
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
 * Throttle function
 */
exports.throttle = (func, limit) => {
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
 * Capitalize first letter
 */
exports.capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Camel case to snake case
 */
exports.camelToSnake = (str) => {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
};

/**
 * Snake case to camel case
 */
exports.snakeToCamel = (str) => {
  return str.replace(/(_\w)/g, matches => matches[1].toUpperCase());
};

/**
 * Convert object keys case
 */
exports.convertKeys = (obj, converter) => {
  if (Array.isArray(obj)) {
    return obj.map(item => exports.convertKeys(item, converter));
  } else if (exports.isObject(obj)) {
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = converter(key);
        newObj[newKey] = exports.convertKeys(obj[key], converter);
      }
    }
    return newObj;
  }
  return obj;
};

/**
 * Sanitize HTML
 */
exports.sanitizeHtml = (html) => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Generate pagination info
 */
exports.generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

/**
 * Mask sensitive data
 */
exports.maskSensitiveData = (data, fields = ['password', 'token', 'secret']) => {
  const masked = exports.deepClone(data);
  
  const maskRecursive = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (fields.includes(key.toLowerCase())) {
          obj[key] = '***';
        } else if (exports.isObject(obj[key])) {
          maskRecursive(obj[key]);
        } else if (Array.isArray(obj[key])) {
          obj[key].forEach(item => {
            if (exports.isObject(item)) maskRecursive(item);
          });
        }
      }
    }
  };

  maskRecursive(masked);
  return masked;
};

/**
 * Calculate tax amount
 */
exports.calculateTax = (amount, taxRate) => {
  return Math.round(amount * taxRate * 100) / 100;
};

/**
 * Calculate discount
 */
exports.calculateDiscount = (amount, discountType, discountValue) => {
  switch (discountType) {
    case 'percentage':
      return Math.round(amount * discountValue * 100) / 100;
    case 'fixed_amount':
      return Math.min(discountValue, amount);
    default:
      return 0;
  }
};

/**
 * Generate order number
 */
exports.generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${timestamp.slice(-6)}-${random}`;
};

/**
 * Validate email
 */
exports.isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number
 */
exports.isValidPhone = (phone) => {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate URL
 */
exports.isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get file extension
 */
exports.getFileExtension = (filename) => {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

/**
 * Get file size in human readable format
 */
exports.formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Sleep/delay function
 */
exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry function with exponential backoff
 */
exports.retry = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await exports.sleep(delay);
    return exports.retry(fn, retries - 1, delay * 2);
  }
};

module.exports = exports;
