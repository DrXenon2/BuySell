const sanitizeHtml = require('sanitize-html');
const logger = require('../utils/logger');

/**
 * Options de sanitization HTML
 */
const sanitizeOptions = {
  allowedTags: [], // Aucun tag HTML autorisé
  allowedAttributes: {}, // Aucun attribut autorisé
  textFilter: function(text) {
    return text.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&#x27;')
               .replace(/\//g, '&#x2F;');
  }
};

/**
 * Sanitizer générique
 */
const sanitize = (data) => {
  if (typeof data === 'string') {
    return sanitizeHtml(data, sanitizeOptions).trim();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Middleware pour sanitizer le body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitize(req.body);
    logger.debug('Body sanitized');
  }
  next();
};

/**
 * Middleware pour sanitizer les query params
 */
const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitize(req.query);
    logger.debug('Query params sanitized');
  }
  next();
};

/**
 * Middleware pour sanitizer les route params
 */
const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitize(req.params);
    logger.debug('Route params sanitized');
  }
  next();
};

/**
 * Sanitizer spécifique pour les champs HTML riches (description, etc.)
 */
const sanitizeRichText = (html) => {
  const richTextOptions = {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li',
      'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre',
      'span', 'img'
    ],
    allowedAttributes: {
      a: ['href', 'name', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      div: ['class'],
      span: ['class'],
      p: ['class'],
      code: ['class']
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data']
    },
    allowProtocolRelative: false
  };

  return sanitizeHtml(html, richTextOptions);
};

/**
 * Valider et sanitizer les emails
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  const sanitized = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(sanitized)) {
    throw new Error('Format d\'email invalide');
  }
  
  return sanitized;
};

/**
 * Valider et sanitizer les URLs
 */
const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return '';
  
  const sanitized = url.trim();
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    throw new Error('URL invalide');
  }
};

module.exports = {
  sanitize,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeRichText,
  sanitizeEmail,
  sanitizeUrl
};
