/**
 * Error handling utilities
 */

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @returns {Object} Formatted error response
 */
export const handleApiError = (error) => {
  console.error('API Error:', error);
  
  // Network error
  if (!error.response) {
    return {
      message: 'Erreur de connexion. Veuillez vérifier votre connexion internet.',
      status: 0,
      code: 'NETWORK_ERROR'
    };
  }
  
  const { status, data } = error.response;
  
  // Handle different HTTP status codes
  switch (status) {
    case 400:
      return {
        message: data?.message || 'Requête invalide.',
        status,
        code: 'BAD_REQUEST',
        errors: data?.errors
      };
      
    case 401:
      return {
        message: data?.message || 'Non autorisé. Veuillez vous connecter.',
        status,
        code: 'UNAUTHORIZED'
      };
      
    case 403:
      return {
        message: data?.message || "Vous n'avez pas la permission d'accéder à cette ressource.",
        status,
        code: 'FORBIDDEN'
      };
      
    case 404:
      return {
        message: data?.message || 'Ressource non trouvée.',
        status,
        code: 'NOT_FOUND'
      };
      
    case 422:
      return {
        message: data?.message || 'Erreur de validation.',
        status,
        code: 'VALIDATION_ERROR',
        errors: data?.errors
      };
      
    case 429:
      return {
        message: 'Trop de requêtes. Veuillez réessayer plus tard.',
        status,
        code: 'RATE_LIMIT'
      };
      
    case 500:
      return {
        message: 'Erreur interne du serveur. Veuillez réessayer plus tard.',
        status,
        code: 'SERVER_ERROR'
      };
      
    default:
      return {
        message: data?.message || 'Une erreur est survenue.',
        status,
        code: 'UNKNOWN_ERROR'
      };
  }
};

/**
 * Handle form validation errors
 * @param {Object} errors - Validation errors object
 * @returns {Object} Formatted validation errors
 */
export const handleValidationErrors = (errors) => {
  const formattedErrors = {};
  
  Object.keys(errors).forEach(field => {
    if (Array.isArray(errors[field])) {
      formattedErrors[field] = errors[field].join(', ');
    } else {
      formattedErrors[field] = errors[field];
    }
  });
  
  return formattedErrors;
};

/**
 * Log error to console with context
 * @param {Error} error - Error object
 * @param {string} context - Error context
 * @param {Object} extra - Extra information
 */
export const logError = (error, context = 'Application', extra = {}) => {
  console.group(`🚨 Error: ${context}`);
  console.error('Message:', error.message);
  console.error('Stack:', error.stack);
  
  if (Object.keys(extra).length > 0) {
    console.error('Extra:', extra);
  }
  
  if (error.response) {
    console.error('Response:', error.response);
  }
  
  console.groupEnd();
};

/**
 * Check if error is a network error
 * @param {Error} error - Error object
 * @returns {boolean} True if network error
 */
export const isNetworkError = (error) => {
  return !error.response && error.request;
};

/**
 * Check if error is a timeout error
 * @param {Error} error - Error object
 * @returns {boolean} True if timeout error
 */
export const isTimeoutError = (error) => {
  return error.code === 'ECONNABORTED' || error.message?.includes('timeout');
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error object
 * @returns {boolean} True if auth error
 */
export const isAuthError = (error) => {
  return error.response?.status === 401 || error.response?.status === 403;
};

/**
 * Global error handler
 * @param {Error} error - Error object
 * @param {Function} callback - Callback function
 */
export const globalErrorHandler = (error, callback = null) => {
  const formattedError = handleApiError(error);
  
  // Log error for debugging
  logError(error, 'Global Error Handler');
  
  // Call callback if provided
  if (callback && typeof callback === 'function') {
    callback(formattedError);
  }
  
  // You can also send to error reporting service here
  // sendToErrorReportingService(error);
  
  return formattedError;
};

/**
 * Create error boundary state
 * @param {Error} error - Error object
 * @returns {Object} Error boundary state
 */
export const createErrorState = (error) => {
  return {
    hasError: true,
    error: error,
    errorInfo: {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
  };
};
