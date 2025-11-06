/**
 * Utilitaires de formatage de données
 */

/**
 * Formate un numéro de téléphone français
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, '');
  
  // Formater selon la longueur
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  } else if (cleaned.length === 9) {
    return cleaned.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  
  return phone;
};

/**
 * Formate un code postal français
 */
export const formatPostalCode = (code) => {
  if (!code) return '';
  
  const cleaned = code.toString().replace(/\D/g, '');
  if (cleaned.length === 5) {
    return cleaned;
  }
  
  return code;
};

/**
 * Formate un numéro de carte bancaire (masqué)
 */
export const formatCreditCard = (number) => {
  if (!number) return '';
  
  const cleaned = number.replace(/\D/g, '');
  if (cleaned.length === 16) {
    return `**** **** **** ${cleaned.slice(-4)}`;
  }
  
  return number;
};

/**
 * Formate un nom avec initiales majuscules
 */
export const formatName = (name) => {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formate une adresse complète
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [
    address.street,
    address.complement,
    `${address.postalCode} ${address.city}`,
    address.country,
  ].filter(Boolean);
  
  return parts.join(', ');
};

/**
 * Formate une durée en minutes en format lisible
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes < 1) return '0 min';
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins} min`;
  } else if (mins === 0) {
    return `${hours} h`;
  } else {
    return `${hours} h ${mins} min`;
  }
};

/**
 * Formate un nombre avec séparateurs de milliers
 */
export const formatNumber = (number, locale = 'fr-FR') => {
  if (number == null || isNaN(number)) return '0';
  
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Formate un pourcentage
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value == null || isNaN(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
};

/**
 * Formate une note sur 5 étoiles
 */
export const formatRating = (rating, max = 5) => {
  if (rating == null || isNaN(rating)) return '0.0';
  
  return rating.toFixed(1);
};

/**
 * Formate un statut de commande en texte lisible
 */
export const formatOrderStatus = (status) => {
  const statusMap = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    processing: 'En traitement',
    shipped: 'Expédiée',
    delivered: 'Livrée',
    cancelled: 'Annulée',
    refunded: 'Remboursée',
  };
  
  return statusMap[status] || status;
};

/**
 * Formate un statut de paiement en texte lisible
 */
export const formatPaymentStatus = (status) => {
  const statusMap = {
    pending: 'En attente',
    paid: 'Payé',
    failed: 'Échoué',
    refunded: 'Remboursé',
    cancelled: 'Annulé',
  };
  
  return statusMap[status] || status;
};

/**
 * Formate un rôle utilisateur en texte lisible
 */
export const formatUserRole = (role) => {
  const roleMap = {
    customer: 'Client',
    seller: 'Vendeur',
    admin: 'Administrateur',
    moderator: 'Modérateur',
  };
  
  return roleMap[role] || role;
};

/**
 * Formate une condition de produit
 */
export const formatProductCondition = (condition) => {
  const conditionMap = {
    new: 'Neuf',
    used: 'Occasion',
    refurbished: 'Reconditionné',
  };
  
  return conditionMap[condition] || condition;
};

/**
 * Formate une méthode de livraison
 */
export const formatShippingMethod = (method) => {
  const methodMap = {
    standard: 'Livraison standard',
    express: 'Livraison express',
    pickup: 'Retrait en magasin',
    same_day: 'Livraison le jour même',
  };
  
  return methodMap[method] || method;
};

/**
 * Formate une méthode de paiement
 */
export const formatPaymentMethod = (method) => {
  const methodMap = {
    card: 'Carte bancaire',
    paypal: 'PayPal',
    bank_transfer: 'Virement bancaire',
    cash: 'Espèces',
    orange_money: 'Orange Money',
    mtn_money: 'MTN Money',
    wave: 'Wave',
  };
  
  return methodMap[method] || method;
};

/**
 * Formate une catégorie pour l'affichage
 */
export const formatCategory = (category) => {
  if (!category) return '';
  
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formate un SKU produit
 */
export const formatSKU = (sku, prefix = 'BS') => {
  if (!sku) return `${prefix}-${Date.now()}`;
  
  if (sku.startsWith(prefix)) {
    return sku;
  }
  
  return `${prefix}-${sku}`;
};

/**
 * Formate un numéro de commande
 */
export const formatOrderNumber = (number, prefix = 'BS') => {
  if (!number) return `${prefix}-${Date.now()}`;
  
  if (number.startsWith(prefix)) {
    return number;
  }
  
  return `${prefix}-${number.toString().padStart(6, '0')}`;
};

/**
 * Formate une quantité avec unité
 */
export const formatQuantity = (quantity, unit = '') => {
  if (quantity == null || isNaN(quantity)) return '0';
  
  const formatted = formatNumber(quantity);
  return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Formate une distance en mètres/km
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  } else {
    return `${(meters / 1000).toFixed(1)} km`;
  }
};

/**
 * Formate un poids en grammes/kg
 */
export const formatWeight = (grams) => {
  if (grams < 1000) {
    return `${grams} g`;
  } else {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
};

/**
 * Formate des dimensions
 */
export const formatDimensions = (dimensions) => {
  if (!dimensions) return '';
  
  const { length, width, height, unit = 'cm' } = dimensions;
  return `${length} × ${width} × ${height} ${unit}`;
};

export default {
  formatPhoneNumber,
  formatPostalCode,
  formatCreditCard,
  formatName,
  formatAddress,
  formatDuration,
  formatNumber,
  formatPercentage,
  formatRating,
  formatOrderStatus,
  formatPaymentStatus,
  formatUserRole,
  formatProductCondition,
  formatShippingMethod,
  formatPaymentMethod,
  formatCategory,
  formatSKU,
  formatOrderNumber,
  formatQuantity,
  formatDistance,
  formatWeight,
  formatDimensions,
};
