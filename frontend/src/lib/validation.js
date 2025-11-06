/**
 * Utilitaires de validation pour les formulaires et données
 */

import { VALIDATION_RULES } from '../config/constants';

/**
 * Valider un email
 */
export const validateEmail = (email) => {
  if (!email) {
    return { isValid: false, message: 'L\'email est requis' };
  }

  const isValid = VALIDATION_RULES.EMAIL.pattern.test(email);
  return {
    isValid,
    message: isValid ? '' : VALIDATION_RULES.EMAIL.message,
  };
};

/**
 * Valider un mot de passe
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Le mot de passe est requis' };
  }

  if (password.length < VALIDATION_RULES.PASSWORD.minLength) {
    return {
      isValid: false,
      message: `Le mot de passe doit contenir au moins ${VALIDATION_RULES.PASSWORD.minLength} caractères`,
    };
  }

  const isValid = VALIDATION_RULES.PASSWORD.pattern.test(password);
  return {
    isValid,
    message: isValid ? '' : VALIDATION_RULES.PASSWORD.message,
  };
};

/**
 * Valider un numéro de téléphone
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, message: 'Le numéro de téléphone est requis' };
  }

  const isValid = VALIDATION_RULES.PHONE.pattern.test(phone);
  return {
    isValid,
    message: isValid ? '' : VALIDATION_RULES.PHONE.message,
  };
};

/**
 * Valider un nom (prénom ou nom)
 */
export const validateName = (name, fieldName = 'Le nom') => {
  if (!name) {
    return { isValid: false, message: `${fieldName} est requis` };
  }

  if (name.length < VALIDATION_RULES.NAME.minLength) {
    return {
      isValid: false,
      message: `${fieldName} doit contenir au moins ${VALIDATION_RULES.NAME.minLength} caractères`,
    };
  }

  if (name.length > VALIDATION_RULES.NAME.maxLength) {
    return {
      isValid: false,
      message: `${fieldName} ne peut pas dépasser ${VALIDATION_RULES.NAME.maxLength} caractères`,
    };
  }

  const isValid = VALIDATION_RULES.NAME.pattern.test(name);
  return {
    isValid,
    message: isValid ? '' : VALIDATION_RULES.NAME.message,
  };
};

/**
 * Valider un prix
 */
export const validatePrice = (price) => {
  if (price === null || price === undefined || price === '') {
    return { isValid: false, message: 'Le prix est requis' };
  }

  const numericPrice = parseFloat(price);
  
  if (isNaN(numericPrice)) {
    return { isValid: false, message: 'Le prix doit être un nombre valide' };
  }

  if (numericPrice < VALIDATION_RULES.PRODUCT.PRICE.min) {
    return {
      isValid: false,
      message: `Le prix doit être d'au moins ${VALIDATION_RULES.PRODUCT.PRICE.min} €`,
    };
  }

  if (numericPrice > VALIDATION_RULES.PRODUCT.PRICE.max) {
    return {
      isValid: false,
      message: `Le prix ne peut pas dépasser ${VALIDATION_RULES.PRODUCT.PRICE.max} €`,
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valider une quantité de stock
 */
export const validateStock = (stock) => {
  if (stock === null || stock === undefined || stock === '') {
    return { isValid: false, message: 'La quantité en stock est requise' };
  }

  const numericStock = parseInt(stock, 10);
  
  if (isNaN(numericStock)) {
    return { isValid: false, message: 'La quantité doit être un nombre entier valide' };
  }

  if (numericStock < VALIDATION_RULES.PRODUCT.STOCK.min) {
    return {
      isValid: false,
      message: `La quantité ne peut pas être inférieure à ${VALIDATION_RULES.PRODUCT.STOCK.min}`,
    };
  }

  if (numericStock > VALIDATION_RULES.PRODUCT.STOCK.max) {
    return {
      isValid: false,
      message: `La quantité ne peut pas dépasser ${VALIDATION_RULES.PRODUCT.STOCK.max}`,
    };
  }

  return { isValid: true, message: '' };
};

/**
 * Valider un formulaire de produit
 */
export const validateProductForm = (productData) => {
  const errors = {};

  // Nom
  const nameValidation = validateName(productData.name, 'Le nom du produit');
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message;
  }

  // Description
  if (!productData.description) {
    errors.description = 'La description est requise';
  } else if (productData.description.length < VALIDATION_RULES.PRODUCT.DESCRIPTION.minLength) {
    errors.description = `La description doit contenir au moins ${VALIDATION_RULES.PRODUCT.DESCRIPTION.minLength} caractères`;
  } else if (productData.description.length > VALIDATION_RULES.PRODUCT.DESCRIPTION.maxLength) {
    errors.description = `La description ne peut pas dépasser ${VALIDATION_RULES.PRODUCT.DESCRIPTION.maxLength} caractères`;
  }

  // Prix
  const priceValidation = validatePrice(productData.price);
  if (!priceValidation.isValid) {
    errors.price = priceValidation.message;
  }

  // Stock
  const stockValidation = validateStock(productData.stockQuantity);
  if (!stockValidation.isValid) {
    errors.stockQuantity = stockValidation.message;
  }

  // Catégorie
  if (!productData.categoryId) {
    errors.categoryId = 'La catégorie est requise';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Valider un formulaire d'adresse
 */
export const validateAddress = (address) => {
  const errors = {};

  if (!address.firstName?.trim()) {
    errors.firstName = 'Le prénom est requis';
  }

  if (!address.lastName?.trim()) {
    errors.lastName = 'Le nom est requis';
  }

  if (!address.street?.trim()) {
    errors.street = 'L\'adresse est requise';
  }

  if (!address.city?.trim()) {
    errors.city = 'La ville est requise';
  }

  if (!address.postalCode?.trim()) {
    errors.postalCode = 'Le code postal est requis';
  }

  if (!address.country?.trim()) {
    errors.country = 'Le pays est requis';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Valider un fichier uploadé
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB par défaut
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFiles = 1,
  } = options;

  const errors = [];

  // Vérifier la taille
  if (file.size > maxSize) {
    errors.push(`Le fichier est trop volumineux (max: ${maxSize / 1024 / 1024}MB)`);
  }

  // Vérifier le type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valider un code promo
 */
export const validateCoupon = (couponCode) => {
  if (!couponCode?.trim()) {
    return { isValid: false, message: 'Le code promo est requis' };
  }

  // Format basique pour les codes promo
  const isValid = /^[A-Z0-9_-]{4,20}$/i.test(couponCode);
  return {
    isValid,
    message: isValid ? '' : 'Format de code promo invalide',
  };
};

/**
 * Valider une date
 */
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, required = true } = options;

  if (!date && !required) {
    return { isValid: true, message: '' };
  }

  if (!date) {
    return { isValid: false, message: 'La date est requise' };
  }

  const dateObj = new Date(date);
  const now = new Date();

  if (isNaN(dateObj.getTime())) {
    return { isValid: false, message: 'Date invalide' };
  }

  if (minDate && dateObj < new Date(minDate)) {
    return { isValid: false, message: `La date ne peut pas être avant ${new Date(minDate).toLocaleDateString()}` };
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return { isValid: false, message: `La date ne peut pas être après ${new Date(maxDate).toLocaleDateString()}` };
  }

  if (dateObj > now) {
    return { isValid: false, message: 'La date ne peut pas être dans le futur' };
  }

  return { isValid: true, message: '' };
};

/**
 * Valider une URL
 */
export const validateURL = (url) => {
  if (!url) {
    return { isValid: false, message: 'L\'URL est requise' };
  }

  try {
    new URL(url);
    return { isValid: true, message: '' };
  } catch {
    return { isValid: false, message: 'URL invalide' };
  }
};

/**
 * Nettoyer et formater les données avant validation
 */
export const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input.trim().replace(/\s+/g, ' ');
  }
  return input;
};

/**
 * Valider un objet complet avec un schéma
 */
export const validateSchema = (data, schema) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const sanitizedValue = sanitizeInput(value);

    // Validation required
    if (rules.required && (!sanitizedValue || sanitizedValue === '')) {
      errors[field] = rules.requiredMessage || `${field} est requis`;
      continue;
    }

    // Validation de longueur
    if (rules.minLength && sanitizedValue?.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `${field} doit contenir au moins ${rules.minLength} caractères`;
      continue;
    }

    if (rules.maxLength && sanitizedValue?.length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `${field} ne peut pas dépasser ${rules.maxLength} caractères`;
      continue;
    }

    // Validation de pattern
    if (rules.pattern && sanitizedValue && !rules.pattern.test(sanitizedValue)) {
      errors[field] = rules.patternMessage || `${field} n'est pas valide`;
      continue;
    }

    // Validation personnalisée
    if (rules.validate && sanitizedValue) {
      const customValidation = rules.validate(sanitizedValue, data);
      if (!customValidation.isValid) {
        errors[field] = customValidation.message;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validatePrice,
  validateStock,
  validateProductForm,
  validateAddress,
  validateFile,
  validateCoupon,
  validateDate,
  validateURL,
  sanitizeInput,
  validateSchema,
};
