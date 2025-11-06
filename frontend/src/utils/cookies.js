/**
 * Cookie utility functions
 */

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Expiration days
 * @param {string} path - Cookie path
 */
export const setCookie = (name, value, days = 365, path = '/') => {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=${path}`;
};

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  
  return null;
};

/**
 * Remove a cookie
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path
 */
export const removeCookie = (name, path = '/') => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;
};

/**
 * Check if cookie exists
 * @param {string} name - Cookie name
 * @returns {boolean} True if exists
 */
export const hasCookie = (name) => {
  return getCookie(name) !== null;
};

/**
 * Get all cookies as object
 * @returns {Object} All cookies
 */
export const getAllCookies = () => {
  const cookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
};
