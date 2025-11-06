const crypto = require('crypto');
const config = require('../config');
const logger = require('./logger');

/**
 * Utilitaires généraux
 */
class Helpers {
  /**
   * Générer un ID unique
   */
  generateId(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Générer un slug à partir d'un texte
   */
  generateSlug(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // Remplacer les espaces par des tirets
      .replace(/[^\w\-]+/g, '')       // Supprimer les caractères non alphanumériques
      .replace(/\-\-+/g, '-')         // Remplacer les tirets multiples par un seul
      .replace(/^-+/, '')             // Supprimer les tirets au début
      .replace(/-+$/, '');            // Supprimer les tirets à la fin
  }

  /**
   * Retarder l'exécution
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Exécuter avec timeout
   */
  async withTimeout(promise, ms, errorMessage = 'Timeout') {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(errorMessage)), ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Retry une opération avec backoff exponentiel
   */
  async retryWithBackoff(operation, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Tentative ${attempt} échouée, nouvel essai dans ${delay}ms`, { error: error.message });
        
        await this.delay(delay + Math.random() * 1000); // Ajouter un jitter
      }
    }
    
    throw lastError;
  }

  /**
   * Valider un email
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valider un numéro de téléphone (format international simplifié)
   */
  isValidPhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * Valider une URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Obtenir l'extension d'un fichier
   */
  getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  /**
   * Formater une taille de fichier
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Tronquer un texte
   */
  truncateText(text, maxLength, suffix = '...') {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
  }

  /**
   * Échapper les caractères HTML
   */
  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  /**
   * Nettoyer un objet (supprimer les valeurs null/undefined)
   */
  cleanObject(obj) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  /**
   * Fusionner des objets profondément
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = source[key];
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      }
    }
    
    return output;
  }

  /**
   * Vérifier si c'est un objet
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Cloner un objet profondément
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }
    
    return cloned;
  }

  /**
   * Différence entre deux objets
   */
  objectDiff(obj1, obj2) {
    const diff = {};
    
    for (const key in obj1) {
      if (obj1.hasOwnProperty(key)) {
        if (!obj2.hasOwnProperty(key) || obj1[key] !== obj2[key]) {
          diff[key] = {
            old: obj1[key],
            new: obj2[key]
          };
        }
      }
    }
    
    for (const key in obj2) {
      if (obj2.hasOwnProperty(key) && !obj1.hasOwnProperty(key)) {
        diff[key] = {
          old: undefined,
          new: obj2[key]
        };
      }
    }
    
    return diff;
  }

  /**
   * Grouper un tableau par clé
   */
  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  }

  /**
   * Ordonner un objet par clés
   */
  sortObjectByKeys(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((sorted, key) => {
        sorted[key] = obj[key];
        return sorted;
      }, {});
  }

  /**
   * Générer une couleur aléatoire
   */
  generateRandomColor() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  /**
   * Calculer l'âge à partir d'une date de naissance
   */
  calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Formater une durée en texte lisible
   */
  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ${minutes % 60}m`;
    
    const days = Math.floor(hours / 24);
    return `${days}j ${hours % 24}h`;
  }

  /**
   * Vérifier si c'est un jour ouvrable
   */
  isBusinessDay(date = new Date()) {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Pas le weekend
  }

  /**
   * Ajouter des jours ouvrables
   */
  addBusinessDays(startDate, days) {
    const date = new Date(startDate);
    let added = 0;
    
    while (added < days) {
      date.setDate(date.getDate() + 1);
      if (this.isBusinessDay(date)) {
        added++;
      }
    }
    
    return date;
  }

  /**
   * Générer un hash simple
   */
  generateHash(data) {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Valider un code postal français
   */
  isValidFrenchPostalCode(code) {
    const postalCodeRegex = /^\d{5}$/;
    return postalCodeRegex.test(code);
  }

  /**
   * Valider un numéro de TVA intracommunautaire
   */
  isValidVATNumber(vat) {
    // Implémentation simplifiée
    const vatRegex = /^[A-Z]{2}[0-9A-Z]{8,12}$/;
    return vatRegex.test(vat.replace(/\s/g, ''));
  }

  /**
   * Générer une empreinte pour la détection de doublons
   */
  generateDuplicateFingerprint(data) {
    const normalized = {
      name: data.name?.toLowerCase().trim(),
      email: data.email?.toLowerCase().trim(),
      phone: data.phone?.replace(/\D/g, ''),
      address: data.address?.toLowerCase().trim().replace(/\s+/g, ' ')
    };
    
    return this.generateHash(normalized);
  }

  /**
   * Calculer la similarité entre deux chaînes (Levenshtein)
   */
  stringSimilarity(str1, str2) {
    const track = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    const distance = track[str2.length][str1.length];
    const maxLength = Math.max(str1.length, str2.length);
    
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  /**
   * Parse une chaîne de requête en objet
   */
  parseQueryString(queryString) {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    for (const [key, value] of params) {
      // Gérer les tableaux
      if (key.endsWith('[]')) {
        const cleanKey = key.slice(0, -2);
        result[cleanKey] = result[cleanKey] || [];
        result[cleanKey].push(value);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Stringifier un objet en chaîne de requête
   */
  stringifyQueryString(obj) {
    const params = new URLSearchParams();
    
    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        value.forEach(item => params.append(`${key}[]`, item));
      } else if (value !== null && value !== undefined) {
        params.append(key, value);
      }
    }
    
    return params.toString();
  }

  /**
   * Capitaliser la première lettre
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * Capitaliser chaque mot
   */
  capitalizeWords(str) {
    return str.replace(/\w\S*/g, txt => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
  }

  /**
   * Générer des initiales
   */
  generateInitials(name) {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  }

  /**
   * Vérifier les permissions
   */
  checkPermissions(userPermissions, requiredPermissions) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    if (userPermissions.includes('admin')) {
      return true;
    }

    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Formater un numéro de téléphone
   */
  formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    }
    
    if (cleaned.length === 12 && cleaned.startsWith('33')) {
      return cleaned.replace(/(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5 $6');
    }
    
    return phone;
  }

  /**
   * Valider un mot de passe fort
   */
  isStrongPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    return password.length >= minLength && 
           hasUpperCase && 
           hasLowerCase && 
           hasNumbers && 
           hasSpecialChar;
  }

  /**
   * Calculer le score de force d'un mot de passe
   */
  passwordStrengthScore(password) {
    let score = 0;
    
    // Longueur
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;
    
    // Complexité
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^a-zA-Z\d]/.test(password)) score += 1;
    
    // Diversité
    const uniqueChars = new Set(password).size;
    if (uniqueChars / password.length > 0.6) score += 1;
    
    return Math.min(score, 5); // Score sur 5
  }
}

module.exports = new Helpers();
