// Validation functions

const { VALIDATION } = require('./constants');
const helpers = require('./helpers');

/**
 * Base validator class
 */
class Validator {
  constructor() {
    this.errors = [];
  }

  addError(field, message, code = 'VALIDATION_ERROR') {
    this.errors.push({ field, message, code });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getErrors() {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }

  validate(schema, data) {
    this.clearErrors();
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      
      for (const rule of rules) {
        const isValid = this.checkRule(rule, value, data);
        if (!isValid) {
          this.addError(field, rule.message, rule.code);
          break; // Stop checking other rules for this field
        }
      }
    }
    
    return !this.hasErrors();
  }

  checkRule(rule, value, data) {
    switch (rule.type) {
      case 'required':
        return this.isRequired(value);
      case 'string':
        return this.isString(value);
      case 'number':
        return this.isNumber(value);
      case 'boolean':
        return this.isBoolean(value);
      case 'array':
        return this.isArray(value);
      case 'object':
        return this.isObject(value);
      case 'email':
        return this.isEmail(value);
      case 'phone':
        return this.isPhone(value);
      case 'url':
        return this.isUrl(value);
      case 'minLength':
        return this.hasMinLength(value, rule.value);
      case 'maxLength':
        return this.hasMaxLength(value, rule.value);
      case 'min':
        return this.hasMinValue(value, rule.value);
      case 'max':
        return this.hasMaxValue(value, rule.value);
      case 'pattern':
        return this.matchesPattern(value, rule.value);
      case 'in':
        return this.isIn(value, rule.value);
      case 'custom':
        return rule.validator(value, data);
      default:
        return true;
    }
  }

  isRequired(value) {
    return !helpers.isEmpty(value);
  }

  isString(value) {
    return typeof value === 'string';
  }

  isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  isBoolean(value) {
    return typeof value === 'boolean';
  }

  isArray(value) {
    return Array.isArray(value);
  }

  isObject(value) {
    return helpers.isObject(value);
  }

  isEmail(value) {
    if (helpers.isEmpty(value)) return true; // Use required for empty checks
    return VALIDATION.EMAIL.PATTERN.test(value);
  }

  isPhone(value) {
    if (helpers.isEmpty(value)) return true;
    return VALIDATION.PHONE.PATTERN.test(value);
  }

  isUrl(value) {
    if (helpers.isEmpty(value)) return true;
    return helpers.isValidUrl(value);
  }

  hasMinLength(value, min) {
    if (helpers.isEmpty(value)) return true;
    return value.length >= min;
  }

  hasMaxLength(value, max) {
    if (helpers.isEmpty(value)) return true;
    return value.length <= max;
  }

  hasMinValue(value, min) {
    if (helpers.isEmpty(value)) return true;
    return value >= min;
  }

  hasMaxValue(value, max) {
    if (helpers.isEmpty(value)) return true;
    return value <= max;
  }

  matchesPattern(value, pattern) {
    if (helpers.isEmpty(value)) return true;
    return pattern.test(value);
  }

  isIn(value, allowedValues) {
    if (helpers.isEmpty(value)) return true;
    return allowedValues.includes(value);
  }
}

/**
 * Validation schemas
 */
const schemas = {
  // User validation schemas
  user: {
    email: [
      { type: 'required', message: 'Email is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Email must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'email', message: 'Invalid email format', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'maxLength', value: 255, message: 'Email must be less than 255 characters', code: 'VALIDATION_MAX_LENGTH' },
    ],
    password: [
      { type: 'required', message: 'Password is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Password must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'minLength', value: VALIDATION.PASSWORD.MIN_LENGTH, message: `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`, code: 'VALIDATION_MIN_LENGTH' },
      { type: 'maxLength', value: VALIDATION.PASSWORD.MAX_LENGTH, message: `Password must be less than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`, code: 'VALIDATION_MAX_LENGTH' },
      { type: 'pattern', value: VALIDATION.PASSWORD.PATTERN, message: 'Password must contain uppercase, lowercase, number and special character', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    firstName: [
      { type: 'required', message: 'First name is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'First name must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'minLength', value: 1, message: 'First name is required', code: 'VALIDATION_MIN_LENGTH' },
      { type: 'maxLength', value: 100, message: 'First name must be less than 100 characters', code: 'VALIDATION_MAX_LENGTH' },
    ],
    lastName: [
      { type: 'required', message: 'Last name is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Last name must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'minLength', value: 1, message: 'Last name is required', code: 'VALIDATION_MIN_LENGTH' },
      { type: 'maxLength', value: 100, message: 'Last name must be less than 100 characters', code: 'VALIDATION_MAX_LENGTH' },
    ],
    phoneNumber: [
      { type: 'phone', message: 'Invalid phone number format', code: 'VALIDATION_INVALID_FORMAT' },
    ],
  },

  // Product validation schemas
  product: {
    title: [
      { type: 'required', message: 'Product title is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Product title must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'minLength', value: 3, message: 'Product title must be at least 3 characters', code: 'VALIDATION_MIN_LENGTH' },
      { type: 'maxLength', value: 255, message: 'Product title must be less than 255 characters', code: 'VALIDATION_MAX_LENGTH' },
    ],
    description: [
      { type: 'required', message: 'Product description is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Product description must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'minLength', value: 10, message: 'Product description must be at least 10 characters', code: 'VALIDATION_MIN_LENGTH' },
      { type: 'maxLength', value: 5000, message: 'Product description must be less than 5000 characters', code: 'VALIDATION_MAX_LENGTH' },
    ],
    price: [
      { type: 'required', message: 'Product price is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'number', message: 'Product price must be a number', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'min', value: 0, message: 'Product price must be greater than or equal to 0', code: 'VALIDATION_MIN_VALUE' },
      { type: 'max', value: 1000000, message: 'Product price must be less than 1,000,000', code: 'VALIDATION_MAX_VALUE' },
    ],
    categoryId: [
      { type: 'required', message: 'Product category is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Product category must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    inventory: [
      { type: 'required', message: 'Inventory information is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'object', message: 'Inventory must be an object', code: 'VALIDATION_INVALID_FORMAT' },
    ],
  },

  // Order validation schemas
  order: {
    items: [
      { type: 'required', message: 'Order items are required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'array', message: 'Order items must be an array', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'minLength', value: 1, message: 'Order must contain at least one item', code: 'VALIDATION_MIN_LENGTH' },
    ],
    shippingAddress: [
      { type: 'required', message: 'Shipping address is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'object', message: 'Shipping address must be an object', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    paymentMethod: [
      { type: 'required', message: 'Payment method is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Payment method must be a string', code: 'VALIDATION_INVALID_FORMAT' },
      { type: 'in', value: Object.values(require('./constants').ORDER.PAYMENT_METHODS), message: 'Invalid payment method', code: 'VALIDATION_INVALID_FORMAT' },
    ],
  },

  // Address validation schemas
  address: {
    firstName: [
      { type: 'required', message: 'First name is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'First name must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    lastName: [
      { type: 'required', message: 'Last name is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Last name must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    street: [
      { type: 'required', message: 'Street address is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Street address must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    city: [
      { type: 'required', message: 'City is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'City must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    state: [
      { type: 'required', message: 'State is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'State must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    postalCode: [
      { type: 'required', message: 'Postal code is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Postal code must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
    country: [
      { type: 'required', message: 'Country is required', code: 'VALIDATION_REQUIRED_FIELD' },
      { type: 'string', message: 'Country must be a string', code: 'VALIDATION_INVALID_FORMAT' },
    ],
  },
};

/**
 * Validation functions
 */
exports.Validator = Validator;

exports.validateUser = (data) => {
  const validator = new Validator();
  return {
    isValid: validator.validate(schemas.user, data),
    errors: validator.getErrors(),
  };
};

exports.validateProduct = (data) => {
  const validator = new Validator();
  return {
    isValid: validator.validate(schemas.product, data),
    errors: validator.getErrors(),
  };
};

exports.validateOrder = (data) => {
  const validator = new Validator();
  return {
    isValid: validator.validate(schemas.order, data),
    errors: validator.getErrors(),
  };
};

exports.validateAddress = (data) => {
  const validator = new Validator();
  return {
    isValid: validator.validate(schemas.address, data),
    errors: validator.getErrors(),
  };
};

/**
 * Sanitization functions
 */
exports.sanitizeUserInput = (data) => {
  const sanitized = { ...data };
  
  if (sanitized.email) {
    sanitized.email = sanitized.email.toLowerCase().trim();
  }
  
  if (sanitized.firstName) {
    sanitized.firstName = helpers.capitalize(sanitized.firstName.trim());
  }
  
  if (sanitized.lastName) {
    sanitized.lastName = helpers.capitalize(sanitized.lastName.trim());
  }
  
  if (sanitized.phoneNumber) {
    sanitized.phoneNumber = sanitized.phoneNumber.replace(/\s/g, '');
  }
  
  return sanitized;
};

exports.sanitizeProductInput = (data) => {
  const sanitized = { ...data };
  
  if (sanitized.title) {
    sanitized.title = sanitized.title.trim();
  }
  
  if (sanitized.description) {
    sanitized.description = helpers.sanitizeHtml(sanitized.description.trim());
  }
  
  if (sanitized.tags && Array.isArray(sanitized.tags)) {
    sanitized.tags = sanitized.tags.map(tag => tag.trim().toLowerCase());
  }
  
  if (sanitized.price) {
    sanitized.price = parseFloat(sanitized.price);
  }
  
  return sanitized;
};

/**
 * Custom validators
 */
exports.isStrongPassword = (password) => {
  if (helpers.isEmpty(password)) return false;
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isLongEnough = password.length >= VALIDATION.PASSWORD.MIN_LENGTH;
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
};

exports.isValidCreditCard = (cardNumber) => {
  // Basic Luhn algorithm check
  let sum = 0;
  let isEven = false;
  
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

exports.isValidExpiryDate = (month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  if (month < 1 || month > 12) return false;
  
  return true;
};

exports.isValidCVV = (cvv) => {
  return /^\d{3,4}$/.test(cvv);
};

/**
 * File validation
 */
exports.isValidFile = (file, allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  if (!file) return false;
  
  // Check file size
  if (file.size > maxSize) {
    return false;
  }
  
  // Check file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return false;
  }
  
  return true;
};

/**
 * Business logic validators
 */
exports.isProductAvailable = (product, quantity = 1) => {
  if (!product) return false;
  if (product.status !== 'published') return false;
  if (!product.inventory.isInStock) return false;
  if (product.inventory.quantity < quantity && !product.inventory.allowBackorder) {
    return false;
  }
  return true;
};

exports.isOrderValid = (order, products) => {
  for (const item of order.items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) return false;
    if (!exports.isProductAvailable(product, item.quantity)) return false;
  }
  return true;
};

module.exports = exports;
