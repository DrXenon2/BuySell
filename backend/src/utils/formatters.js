const config = require('../config');
const logger = require('./logger');

/**
 * Utilitaires de formatage
 */
class Formatters {
  /**
   * Formater un prix
   */
  formatPrice(amount, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Formater un pourcentage
   */
  formatPercentage(value, decimals = 2) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  /**
   * Formater un nombre
   */
  formatNumber(number, decimals = 0) {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(number);
  }

  /**
   * Formater une date
   */
  formatDate(date, format = 'medium') {
    const dateObj = new Date(date);
    
    const options = {
      short: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      },
      medium: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      long: {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      },
      time: {
        hour: '2-digit',
        minute: '2-digit'
      },
      date: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    };

    return new Intl.DateTimeFormat('fr-FR', options[format] || options.medium).format(dateObj);
  }

  /**
   * Formater une date relative (il y a...)
   */
  formatRelativeDate(date) {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now - target;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'à l\'instant';
    } else if (diffMins < 60) {
      return `il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `il y a ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `il y a ${years} an${years > 1 ? 's' : ''}`;
    }
  }

  /**
   * Formater une durée
   */
  formatDuration(ms, format = 'auto') {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (format === 'auto') {
      if (days > 0) {
        return `${days}j ${hours % 24}h`;
      } else if (hours > 0) {
        return `${hours}h ${minutes % 60}min`;
      } else if (minutes > 0) {
        return `${minutes}min ${seconds % 60}s`;
      } else {
        return `${seconds}s`;
      }
    }

    switch (format) {
      case 'short':
        if (days > 0) return `${days}j`;
        if (hours > 0) return `${hours}h`;
        if (minutes > 0) return `${minutes}min`;
        return `${seconds}s`;

      case 'long':
        const parts = [];
        if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
        if (hours % 24 > 0) parts.push(`${hours % 24} heure${hours % 24 > 1 ? 's' : ''}`);
        if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`);
        if (seconds % 60 > 0 && hours === 0) parts.push(`${seconds % 60} seconde${seconds % 60 > 1 ? 's' : ''}`);
        return parts.join(' ') || '0 seconde';

      case 'digital':
        const h = hours.toString().padStart(2, '0');
        const m = (minutes % 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return days > 0 ? `${days}:${h}:${m}:${s}` : `${h}:${m}:${s}`;

      default:
        return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
  }

  /**
   * Formater une taille de fichier
   */
  formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  }

  /**
   * Formater un nom
   */
  formatName(firstName, lastName, format = 'full') {
    switch (format) {
      case 'full':
        return `${firstName} ${lastName}`.trim();
      
      case 'last_first':
        return `${lastName} ${firstName}`.trim();
      
      case 'initial':
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
      
      case 'short':
        return `${firstName} ${lastName?.charAt(0) || ''}.`.trim();
      
      default:
        return `${firstName} ${lastName}`.trim();
    }
  }

  /**
   * Formater une adresse
   */
  formatAddress(address, format = 'multiline') {
    const parts = [
      address.street,
      address.street2,
      `${address.postal_code} ${address.city}`.trim(),
      address.state,
      address.country
    ].filter(part => part && part.trim());

    switch (format) {
      case 'multiline':
        return parts.join('\n');
      
      case 'inline':
        return parts.join(', ');
      
      case 'short':
        return `${address.city} (${address.postal_code})`;
      
      default:
        return parts.join(', ');
    }
  }

  /**
   * Formater un numéro de téléphone
   */
  formatPhoneNumber(phone, format = 'international') {
    const cleaned = phone.replace(/\D/g, '');

    switch (format) {
      case 'international':
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
          return `+33 ${cleaned.slice(1).replace(/(\d{2})/g, '$1 ').trim()}`;
        } else if (cleaned.length === 12 && cleaned.startsWith('33')) {
          return `+${cleaned.slice(0, 2)} ${cleaned.slice(2).replace(/(\d{2})/g, '$1 ').trim()}`;
        }
        return phone;

      case 'national':
        if (cleaned.length === 10 && cleaned.startsWith('0')) {
          return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
        }
        return phone;

      case 'compact':
        return cleaned;

      default:
        return phone;
    }
  }

  /**
   * Formater un statut
   */
  formatStatus(status, type = 'order') {
    const statusMaps = {
      order: {
        pending: { text: 'En attente', color: 'orange', icon: '⏳' },
        confirmed: { text: 'Confirmée', color: 'blue', icon: '✅' },
        processing: { text: 'En traitement', color: 'purple', icon: '⚙️' },
        shipped: { text: 'Expédiée', color: 'teal', icon: '🚚' },
        delivered: { text: 'Livrée', color: 'green', icon: '📦' },
        cancelled: { text: 'Annulée', color: 'red', icon: '❌' },
        refunded: { text: 'Remboursée', color: 'gray', icon: '💸' }
      },
      payment: {
        pending: { text: 'En attente', color: 'orange', icon: '⏳' },
        processing: { text: 'En traitement', color: 'blue', icon: '⚙️' },
        succeeded: { text: 'Réussi', color: 'green', icon: '✅' },
        failed: { text: 'Échoué', color: 'red', icon: '❌' },
        refunded: { text: 'Remboursé', color: 'gray', icon: '💸' }
      },
      user: {
        active: { text: 'Actif', color: 'green', icon: '✅' },
        inactive: { text: 'Inactif', color: 'gray', icon: '⏸️' },
        suspended: { text: 'Suspendu', color: 'red', icon: '🚫' },
        pending: { text: 'En attente', color: 'orange', icon: '⏳' }
      }
    };

    const statusMap = statusMaps[type] || statusMaps.order;
    return statusMap[status] || { text: status, color: 'gray', icon: '❓' };
  }

  /**
   * Formater un rôle
   */
  formatRole(role) {
    const roleMap = {
      customer: { text: 'Client', color: 'blue', level: 1 },
      seller: { text: 'Vendeur', color: 'green', level: 2 },
      admin: { text: 'Administrateur', color: 'red', level: 3 },
      moderator: { text: 'Modérateur', color: 'purple', level: 2 }
    };

    return roleMap[role] || { text: role, color: 'gray', level: 0 };
  }

  /**
   * Formater une note
   */
  formatRating(rating, max = 5) {
    const fullStars = '★'.repeat(Math.floor(rating));
    const emptyStars = '☆'.repeat(max - Math.floor(rating));
    return fullStars + emptyStars;
  }

  /**
   * Formater un texte avec élision
   */
  formatTextEllipsis(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substr(0, maxLength - suffix.length);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > 0) {
      return truncated.substr(0, lastSpace) + suffix;
    }
    
    return truncated + suffix;
  }

  /**
   * Formater un code de réduction
   */
  formatCouponCode(code) {
    return code.toUpperCase().replace(/\s/g, '');
  }

  /**
   * Formater un SKU
   */
  formatSKU(sku) {
    return sku.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  /**
   * Formater une URL
   */
  formatUrl(url, baseUrl = '') {
    if (!url) return '';
    
    // Ajouter le protocole si manquant
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Ajouter la base URL si relative
    if (baseUrl && url.startsWith('/')) {
      url = baseUrl + url;
    }
    
    return url;
  }

  /**
   * Formater des métadonnées
   */
  formatMetadata(metadata, format = 'json') {
    try {
      if (typeof metadata === 'string') {
        metadata = JSON.parse(metadata);
      }

      switch (format) {
        case 'json':
          return JSON.stringify(metadata, null, 2);
        
        case 'inline':
          return Object.entries(metadata)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
        
        case 'table':
          return Object.entries(metadata)
            .map(([key, value]) => ({ key, value }));
        
        default:
          return metadata;
      }
    } catch (error) {
      return metadata;
    }
  }

  /**
   * Formater des statistiques
   */
  formatStats(stats, type = 'sales') {
    const formatted = { ...stats };

    // Formater les montants
    if (formatted.total_revenue) {
      formatted.total_revenue_formatted = this.formatPrice(formatted.total_revenue);
    }

    if (formatted.average_order_value) {
      formatted.average_order_value_formatted = this.formatPrice(formatted.average_order_value);
    }

    // Formater les pourcentages
    if (formatted.conversion_rate) {
      formatted.conversion_rate_formatted = this.formatPercentage(formatted.conversion_rate);
    }

    if (formatted.growth_rate) {
      formatted.growth_rate_formatted = this.formatPercentage(formatted.growth_rate);
    }

    // Formater les dates
    if (formatted.period_start && formatted.period_end) {
      formatted.period_formatted = `${this.formatDate(formatted.period_start, 'short')} - ${this.formatDate(formatted.period_end, 'short')}`;
    }

    return formatted;
  }

  /**
   * Formater un message de notification
   */
  formatNotificationMessage(template, data) {
    let message = template;
    
    // Remplacer les variables {{variable}}
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      message = message.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return message;
  }

  /**
   * Formater un chemin de fichier
   */
  formatFilePath(path, options = {}) {
    let formatted = path;
    
    // Normaliser les séparateurs
    formatted = formatted.replace(/\\/g, '/');
    
    // Supprimer les doubles slashes
    formatted = formatted.replace(/\/\/+/g, '/');
    
    // Ajouter un slash de début si demandé
    if (options.leadingSlash && !formatted.startsWith('/')) {
      formatted = '/' + formatted;
    }
    
    // Supprimer le slash de fin si demandé
    if (options.noTrailingSlash && formatted.endsWith('/')) {
      formatted = formatted.slice(0, -1);
    }
    
    return formatted;
  }

  /**
   * Formater un nom de fichier sécurisé
   */
  formatFileName(filename, options = {}) {
    let formatted = filename;
    
    // Remplacer les caractères spéciaux
    formatted = formatted.replace(/[^a-zA-Z0-9\-_.]/g, '_');
    
    // Limiter la longueur
    if (options.maxLength && formatted.length > options.maxLength) {
      const extension = formatted.split('.').pop();
      const name = formatted.slice(0, options.maxLength - extension.length - 1);
      formatted = name + '.' + extension;
    }
    
    // Convertir en minuscules si demandé
    if (options.lowercase) {
      formatted = formatted.toLowerCase();
    }
    
    return formatted;
  }

  /**
   * Formater un tableau pour l'affichage
   */
  formatArray(array, options = {}) {
    if (!array || array.length === 0) {
      return options.emptyText || 'Aucun élément';
    }

    if (array.length === 1) {
      return array[0];
    }

    if (array.length === 2) {
      return array.join(` ${options.separator || 'et'} `);
    }

    const last = array.pop();
    return array.join(', ') + ` ${options.separator || 'et'} ` + last;
  }

  /**
   * Formater une durée en texte lisible
   */
  formatDurationText(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const parts = [];
    
    if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
    if (hours % 24 > 0) parts.push(`${hours % 24} heure${hours % 24 > 1 ? 's' : ''}`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60} minute${minutes % 60 > 1 ? 's' : ''}`);
    if (seconds % 60 > 0 && hours === 0) parts.push(`${seconds % 60} seconde${seconds % 60 > 1 ? 's' : ''}`);

    return parts.join(' ') || '0 seconde';
  }

  /**
   * Formater une couleur HEX en RGB
   */
  formatHexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Formater une couleur RGB en HEX
   */
  formatRgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }
}

module.exports = new Formatters();
