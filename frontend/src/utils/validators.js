/**
 * Utilitaires de validation de données
 */

/**
 * Validation d'email
 */
export const validateEmail = (email) => {
  if (!email) return { isValid: false, message: 'L\'email est requis' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  
  return {
    isValid,
    message: isValid ? '' : 'Veuillez entrer une adresse email valide',
  };
};

/**
 * Validation de mot de passe
 */
export const validatePassword = (password) => {
  if (!password) return { isValid: false, message: 'Le mot de passe est requis' };
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`au moins ${minLength} caractères`);
  }
  if (!hasUpperCase) {
    errors.push('une majuscule');
  }
  if (!hasLowerCase) {
    errors.push('une minuscule');
  }
  if (!hasNumbers) {
    errors.push('un chiffre');
  }
  if (!hasSpecialChar) {
    errors.push('un caractère spécial');
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    message: isValid ? '' : `Le mot de passe doit contenir ${errors.join(', ')}`,
    details: {
      length: password.length >= minLength,
      upperCase: hasUpperCase,
      lowerCase: hasLowerCase,
      numbers: hasNumbers,
      specialChar: hasSpecialChar,
    },
  };
};

/**
 * Validation de numéro de téléphone
 */
export const validatePhone = (phone) => {
  if (!phone) return { isValid: false, message: 'Le numéro de téléphone est requis' };
  
  const cleaned = phone.replace(/\D/g, '');
  const isValid = cleaned.length >= 9 && cleaned.length <= 15;
  
  return {
    isValid,
    message: isValid ? '' : 'Veuillez entrer un numéro de téléphone valide',
  };
};

/**
 * Validation de nom
 */
export const validateName = (name, fieldName = 'Le nom') => {
  if (!name) return { isValid: false, message: `${fieldName} est requis` };
  
  const minLength = 2;
  const maxLength = 50;
  const nameRegex = /^[a-zA-ZÀ-ÿ\s\-']+$/;
  
  const errors = [];
  
  if (name.length < minLength) {
    errors.push(`au moins ${minLength} caractères`);
  }
  if (name.length > maxLength) {
    errors.push(`au maximum ${maxLength} caractères`);
  }
  if (!nameRegex.test(name)) {
    errors.push('uniquement des lettres, espaces, tirets et apostrophes');
  }
  
  const isValid = errors.length === 0;
  
  return {
    isValid,
    message: isValid ? '' : `${fieldName} doit contenir ${errors.join(', ')}`,
  };
};

/**
 * Validation de code postal français
 */
export const validatePostalCode = (code) => {
  if (!code) return { isValid: false, message: 'Le code postal est requis' };
  
  const cleaned = code.toString().replace(/\D/g, '');
  const isValid = cleaned.length === 5;
  
  return {
    isValid,
    message: isValid ? '' : 'Le code postal doit contenir 5 chiffres',
  };
};

/**
 * Validation de prix
 */
export const validatePrice = (price, options = {}) => {
  const { min = 0.01, max = 1000000, required = true } = options;
  
  if (!price && !required) {
    return { isValid: true, message: '' };
  }
  
  if (!price) {
    return { isValid: false, message: 'Le prix est requis' };
  }
  
  const numericPrice = parseFloat(price);
  
  if (isNaN(numericPrice)) {
    return { isValid: false, message: 'Le prix doit être un nombre valide' };
  }
  
  if (numericPrice < min) {
    return { isValid: false, message: `Le prix doit être d'au moins ${min} €` };
  }
  
  if (numericPrice > max) {
    return { isValid: false, message: `Le prix ne peut pas dépasser ${max} €` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validation de quantité
 */
export const validateQuantity = (quantity, options = {}) => {
  const { min = 0, max = 10000, required = true } = options;
  
  if (!quantity && !required) {
    return { isValid: true, message: '' };
  }
  
  if (!quantity) {
    return { isValid: false, message: 'La quantité est requise' };
  }
  
  const numericQuantity = parseInt(quantity, 10);
  
  if (isNaN(numericQuantity)) {
    return { isValid: false, message: 'La quantité doit être un nombre entier valide' };
  }
  
  if (numericQuantity < min) {
    return { isValid: false, message: `La quantité ne peut pas être inférieure à ${min}` };
  }
  
  if (numericQuantity > max) {
    return { isValid: false, message: `La quantité ne peut pas dépasser ${max}` };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validation de date
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
    return { isValid: false, message: `La date ne peut pas être avant ${new Date(minDate).toLocaleDateString('fr-FR')}` };
  }
  
  if (maxDate && dateObj > new Date(maxDate)) {
    return { isValid: false, message: `La date ne peut pas être après ${new Date(maxDate).toLocaleDateString('fr-FR')}` };
  }
  
  if (dateObj > now) {
    return { isValid: false, message: 'La date ne peut pas être dans le futur' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validation d'URL
 */
export const validateURL = (url, options = {}) => {
  const { required = true } = options;
  
  if (!url && !required) {
    return { isValid: true, message: '' };
  }
  
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
 * Validation de fichier
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    required = true,
  } = options;
  
  if (!file && !required) {
    return { isValid: true, message: '' };
  }
  
  if (!file) {
    return { isValid: false, message: 'Le fichier est requis' };
  }
  
  const errors = [];
  
  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / 1024 / 1024).toFixed(1);
    errors.push(`La taille du fichier ne peut pas dépasser ${maxSizeMB} MB`);
  }
  
  // Vérifier le type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes.map(type => {
      const extension = type.split('/')[1];
      return extension.toUpperCase();
    }).join(', ');
    
    errors.push(`Type de fichier non autorisé. Types acceptés: ${allowedExtensions}`);
  }
  
  return {
    isValid: errors.length === 0,
    message: errors.join(' '),
    errors,
  };
};

/**
 * Validation de code promo
 */
export const validateCoupon = (code) => {
  if (!code) return { isValid: false, message: 'Le code promo est requis' };
  
  const codeRegex = /^[A-Z0-9_-]{4,20}$/i;
  const isValid = codeRegex.test(code);
  
  return {
    isValid,
    message: isValid ? '' : 'Format de code promo invalide',
  };
};

/**
 * Validation d'adresse
 */
export const validateAddress = (address) => {
  const errors = {};
  
  if (!address?.street?.trim()) {
    errors.street = 'La rue est requise';
  }
  
  if (!address?.city?.trim()) {
    errors.city = 'La ville est requise';
  }
  
  if (!address?.postalCode?.trim()) {
    errors.postalCode = 'Le code postal est requis';
  } else {
    const postalCodeValidation = validatePostalCode(address.postalCode);
    if (!postalCodeValidation.isValid) {
      errors.postalCode = postalCodeValidation.message;
    }
  }
  
  if (!address?.country?.trim()) {
    errors.country = 'Le pays est requis';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validation de produit
 */
export const validateProduct = (product) => {
  const errors = {};
  
  // Nom
  if (!product?.name?.trim()) {
    errors.name = 'Le nom du produit est requis';
  } else if (product.name.length < 3) {
    errors.name = 'Le nom doit contenir au moins 3 caractères';
  } else if (product.name.length > 200) {
    errors.name = 'Le nom ne peut pas dépasser 200 caractères';
  }
  
  // Description
  if (!product?.description?.trim()) {
    errors.description = 'La description est requise';
  } else if (product.description.length < 10) {
    errors.description = 'La description doit contenir au moins 10 caractères';
  } else if (product.description.length > 2000) {
    errors.description = 'La description ne peut pas dépasser 2000 caractères';
  }
  
  // Prix
  const priceValidation = validatePrice(product?.price);
  if (!priceValidation.isValid) {
    errors.price = priceValidation.message;
  }
  
  // Quantité
  const quantityValidation = validateQuantity(product?.stockQuantity);
  if (!quantityValidation.isValid) {
    errors.stockQuantity = quantityValidation.message;
  }
  
  // Catégorie
  if (!product?.categoryId) {
    errors.categoryId = 'La catégorie est requise';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validation de formulaire générique
 */
export const validateForm = (data, schema) => {
  const errors = {};
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    
    // Required validation
    if (rules.required && (!value || value === '')) {
      errors[field] = rules.requiredMessage || `${field} est requis`;
      continue;
    }
    
    // Length validation
    if (rules.minLength && value?.length < rules.minLength) {
      errors[field] = rules.minLengthMessage || `${field} doit contenir au moins ${rules.minLength} caractères`;
      continue;
    }
    
    if (rules.maxLength && value?.length > rules.maxLength) {
      errors[field] = rules.maxLengthMessage || `${field} ne peut pas dépasser ${rules.maxLength} caractères`;
      continue;
    }
    
    // Pattern validation
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors[field] = rules.patternMessage || `${field} n'est pas valide`;
      continue;
    }
    
    // Custom validation
    if (rules.validate && value) {
      const customValidation = rules.validate(value, data);
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

/**
 * Validation de carte de crédit (algorithme de Luhn)
 */
export const validateCreditCard = (number) => {
  if (!number) return { isValid: false, message: 'Le numéro de carte est requis' };
  
  const cleaned = number.replace(/\s+/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'Le numéro de carte ne doit contenir que des chiffres' };
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10);
    
    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    
    sum += digit;
    isEven = !isEven;
  }
  
  const isValid = sum % 10 === 0;
  
  return {
    isValid,
    message: isValid ? '' : 'Numéro de carte invalide',
  };
};

/**
 * Validation de date d'expiration de carte
 */
export const validateCardExpiry = (month, year) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const numericMonth = parseInt(month, 10);
  const numericYear = parseInt(year, 10);
  
  if (isNaN(numericMonth) || isNaN(numericYear)) {
    return { isValid: false, message: 'Date d\'expiration invalide' };
  }
  
  if (numericMonth < 1 || numericMonth > 12) {
    return { isValid: false, message: 'Mois invalide' };
  }
  
  if (numericYear < currentYear) {
    return { isValid: false, message: 'La carte a expiré' };
  }
  
  if (numericYear === currentYear && numericMonth < currentMonth) {
    return { isValid: false, message: 'La carte a expiré' };
  }
  
  return { isValid: true, message: '' };
};

/**
 * Validation de code de sécurité de carte (CVC)
 */
export const validateCardCVC = (cvc, cardType = '') => {
  if (!cvc) return { isValid: false, message: 'Le code CVC est requis' };
  
  const cleaned = cvc.replace(/\s+/g, '');
  
  if (!/^\d+$/.test(cleaned)) {
    return { isValid: false, message: 'Le code CVC ne doit contenir que des chiffres' };
  }
  
  let isValid = false;
  
  if (cardType === 'amex') {
    isValid = cleaned.length === 4;
  } else {
    isValid = cleaned.length === 3;
  }
  
  return {
    isValid,
    message: isValid ? '' : 'Code CVC invalide',
  };
};

export default {
  validateEmail,
  validatePassword,
  validatePhone,
  validateName,
  validatePostalCode,
  validatePrice,
  validateQuantity,
  validateDate,
  validateURL,
  validateFile,
  validateCoupon,
  validateAddress,
  validateProduct,
  validateForm,
  validateCreditCard,
  validateCardExpiry,
  validateCardCVC,
};
