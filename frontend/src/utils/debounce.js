/**
 * Debounce utility functions
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} immediate - Whether to trigger the function on the leading edge
 * @returns {Function} Debounced function
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
 * Debounce hook compatible version
 * @param {Function} callback - Callback function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const createDebounce = (callback, delay = 300) => {
  let timeoutId;
  
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => callback.apply(this, args), delay);
  };
};

/**
 * Debounce for search inputs with leading edge
 * @param {Function} searchFunc - Search function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced search function
 */
export const debounceSearch = (searchFunc, delay = 500) => {
  return debounce(searchFunc, delay, false);
};

/**
 * Debounce for resize events
 * @param {Function} resizeFunc - Resize function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced resize function
 */
export const debounceResize = (resizeFunc, delay = 250) => {
  return debounce(resizeFunc, delay, false);
};

/**
 * Debounce for scroll events
 * @param {Function} scrollFunc - Scroll function
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced scroll function
 */
export const debounceScroll = (scrollFunc, delay = 100) => {
  return debounce(scrollFunc, delay, false);
};
