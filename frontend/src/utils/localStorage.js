/**
 * LocalStorage utility functions
 */

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error getting ${key} from localStorage:`, error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export const setToStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error setting ${key} in localStorage:`, error);
    return false;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeFromStorage = (key) => {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
    return false;
  }
};

/**
 * Clear all items from localStorage
 * @returns {boolean} Success status
 */
export const clearStorage = () => {
  try {
    window.localStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
};

/**
 * Get multiple items from localStorage
 * @param {Array} keys - Array of keys
 * @returns {Object} Object with key-value pairs
 */
export const getMultipleFromStorage = (keys) => {
  const result = {};
  
  keys.forEach(key => {
    result[key] = getFromStorage(key);
  });
  
  return result;
};

/**
 * Set multiple items in localStorage
 * @param {Object} items - Object with key-value pairs
 * @returns {boolean} Success status
 */
export const setMultipleToStorage = (items) => {
  try {
    Object.keys(items).forEach(key => {
      setToStorage(key, items[key]);
    });
    return true;
  } catch (error) {
    console.error('Error setting multiple items in localStorage:', error);
    return false;
  }
};

/**
 * Check if key exists in localStorage
 * @param {string} key - Storage key
 * @returns {boolean} True if exists
 */
export const existsInStorage = (key) => {
  return window.localStorage.getItem(key) !== null;
};

/**
 * Get storage usage information
 * @returns {Object} Storage usage info
 */
export const getStorageInfo = () => {
  let totalSize = 0;
  
  for (let key in window.localStorage) {
    if (window.localStorage.hasOwnProperty(key)) {
      totalSize += window.localStorage[key].length;
    }
  }
  
  return {
    totalSize: totalSize,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    itemCount: window.localStorage.length
  };
};
