const Joi = require('joi');
const logger = require('./logger');

/**
 * Utilitaires de validation
 */
class Validators {
  /**
   * Valider un UUID
   */
  isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Valider un objet avec un schéma Joi
   */
  validateWithJoi(data, schema) {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return {
        isValid: false,
        errors,
        value: null
      };
    }

    return {
      isValid: true,
      errors: null,
      value
    };
  }

  /**
   * Valider un email
   */
  validateEmail(email) {
    const schema = Joi.string().email().required();
    return this.validateWithJoi(email, schema);
  }

  /**
   * Valider un numéro de téléphone
   */
  validatePhone(phone) {
    const schema = Joi.string().pattern(/^\+?[\d\s\-\(\)]{10,}$/).required();
    return this.validateWithJoi(phone, schema);
  }

  /**
   * Valider une URL
   */
  validateUrl(url) {
    const schema = Joi.string().uri().required();
    return this.validateWithJoi(url, schema);
  }

  /**
   * Valider une date
   */
  validateDate(dateString) {
    const schema = Joi.date().iso().required();
    return this.validateWithJoi(dateString, schema);
  }

  /**
   * Valider un prix
   */
  validatePrice(price) {
    const schema = Joi.number().min(0).precision(2).required();
    return this.validateWithJoi(price, schema);
  }

  /**
   * Valider une quantité
   */
  validateQuantity(quantity) {
    const schema = Joi.number().integer().min(0).required();
    return this.validateWithJoi(quantity, schema);
  }

  /**
   * Valider un pourcentage
   */
  validatePercentage(percentage) {
    const schema = Joi.number().min(0).max(100).precision(2).required();
    return this.validateWithJoi(percentage, schema);
  }

  /**
   * Valider un code postal français
   */
  validateFrenchPostalCode(postalCode) {
    const schema = Joi.string().pattern(/^\d{5}$/).required();
    return this.validateWithJoi(postalCode, schema);
  }

  /**
   * Valider un IBAN
   */
  validateIBAN(iban) {
    // Validation basique de l'IBAN
    const schema = Joi.string().pattern(/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/).required();
    return this.validateWithJoi(iban, schema);
  }

  /**
   * Valider un code promo
   */
  validateCouponCode(code) {
    const schema = Joi.string().alphanum().uppercase().min(4).max(20).required();
    return this.validateWithJoi(code, schema);
  }

  /**
   * Valider des coordonnées GPS
   */
  validateCoordinates(lat, lng) {
    const schema = Joi.object({
      lat: Joi.number().min(-90).max(90).required(),
      lng: Joi.number().min(-180).max(180).required()
    });

    return this.validateWithJoi({ lat, lng }, schema);
  }

  /**
   * Valider un fichier
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB par défaut
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
    } = options;

    const errors = [];

    // Taille
    if (file.size > maxSize) {
      errors.push(`Fichier trop volumineux: ${file.size} bytes. Maximum: ${maxSize} bytes`);
    }

    // Type MIME
    if (!allowedTypes.includes(file.mimetype)) {
      errors.push(`Type de fichier non autorisé: ${file.mimetype}`);
    }

    // Extension
    const extension = file.originalname.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      errors.push(`Extension de fichier non autorisée: ${extension}`);
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : null
    };
  }

  /**
   * Valider une adresse
   */
  validateAddress(address) {
    const schema = Joi.object({
      street: Joi.string().max(255).required(),
      city: Joi.string().max(100).required(),
      state: Joi.string().max(100).required(),
      postal_code: Joi.string().max(20).required(),
      country: Joi.string().max(100).required(),
      type: Joi.string().valid('home', 'work', 'billing', 'shipping').default('home')
    });

    return this.validateWithJoi(address, schema);
  }

  /**
   * Valider des métadonnées
   */
  validateMetadata(metadata) {
    try {
      if (typeof metadata === 'string') {
        JSON.parse(metadata);
      } else if (typeof metadata === 'object') {
        JSON.stringify(metadata);
      }
      return { isValid: true, errors: null };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Métadonnées JSON invalides']
      };
    }
  }

  /**
   * Valider un tableau d'IDs
   */
  validateIdArray(ids) {
    const schema = Joi.array().items(Joi.string().guid()).min(1).required();
    return this.validateWithJoi(ids, schema);
  }

  /**
   * Valider des options de pagination
   */
  validatePagination(options) {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      sort_by: Joi.string().optional(),
      sort_order: Joi.string().valid('asc', 'desc').default('desc')
    });

    return this.validateWithJoi(options, schema);
  }

  /**
   * Valider des options de filtre
   */
  validateFilterOptions(filters, allowedFilters = []) {
    const filterSchema = {};
    
    allowedFilters.forEach(filter => {
      filterSchema[filter] = Joi.any().optional();
    });

    const schema = Joi.object(filterSchema);

    return this.validateWithJoi(filters, schema);
  }

  /**
   * Valider un token JWT basique
   */
  validateJWTToken(token) {
    const schema = Joi.string().pattern(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/).required();
    return this.validateWithJoi(token, schema);
  }

  /**
   * Valider une configuration
   */
  validateConfig(config, schema) {
    return this.validateWithJoi(config, schema);
  }

  /**
   * Valider des paramètres d'API
   */
  validateApiParams(params, schema) {
    return this.validateWithJoi(params, schema);
  }

  /**
   * Valider un schéma de base de données
   */
  validateDatabaseSchema(schema) {
    // Validation basique d'un schéma de table
    const tableSchema = Joi.object({
      table_name: Joi.string().required(),
      columns: Joi.array().items(Joi.object({
        name: Joi.string().required(),
        type: Joi.string().required(),
        required: Joi.boolean().default(false),
        unique: Joi.boolean().default(false)
      })).min(1)
    });

    return this.validateWithJoi(schema, tableSchema);
  }
}

module.exports = new Validators();
