const crypto = require('crypto');
const config = require('../config');
const logger = require('./logger');

/**
 * Générateurs divers
 */
class Generators {
  /**
   * Générer un ID unique
   */
  generateId(length = 16, format = 'hex') {
    const bytes = crypto.randomBytes(length);
    
    switch (format) {
      case 'hex':
        return bytes.toString('hex');
      case 'base64':
        return bytes.toString('base64').replace(/[+/=]/g, '');
      case 'numeric':
        return parseInt(bytes.toString('hex').substring(0, 8), 16).toString().padStart(8, '0');
      default:
        return bytes.toString('hex');
    }
  }

  /**
   * Générer un token sécurisé
   */
  generateToken(length = 32, format = 'base64') {
    return this.generateId(length, format);
  }

  /**
   * Générer un code de vérification
   */
  generateVerificationCode(length = 6) {
    return Math.random().toString().substring(2, 2 + length);
  }

  /**
   * Générer un mot de passe aléatoire
   */
  generatePassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Assurer au moins un caractère de chaque type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
    
    // Remplir le reste
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Mélanger
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Générer un nom d'utilisateur
   */
  generateUsername(firstName, lastName) {
    const base = (firstName?.charAt(0) || '') + (lastName || 'user');
    const clean = base.toLowerCase().replace(/[^a-z0-9]/g, '');
    const random = Math.random().toString(36).substring(2, 6);
    
    return `${clean}${random}`;
  }

  /**
   * Générer un slug unique
   */
  generateSlug(text, maxLength = 50) {
    let slug = text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
    
    // Tronquer si nécessaire
    if (slug.length > maxLength) {
      slug = slug.substring(0, maxLength).replace(/-+$/, '');
    }
    
    // Ajouter un suffixe aléatoire pour l'unicité
    const random = Math.random().toString(36).substring(2, 6);
    return `${slug}-${random}`;
  }

  /**
   * Générer un code promo
   */
  generateCouponCode(length = 8, prefix = '') {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = prefix;
    
    for (let i = 0; i < length; i++) {
      code += charset[Math.floor(Math.random() * charset.length)];
    }
    
    return code;
  }

  /**
   * Générer un SKU
   */
  generateSKU(category = 'PROD', length = 6) {
    const random = Math.random().toString(36).substring(2, 2 + length).toUpperCase();
    return `${category}-${random}`;
  }

  /**
   * Générer un numéro de commande
   */
  generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CMD-${timestamp}-${random}`;
  }

  /**
   * Générer un numéro de facture
   */
  generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const sequence = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    return `FACT-${year}${month}-${sequence}`;
  }

  /**
   * Générer un numéro de tracking
   */
  generateTrackingNumber(carrier = 'UPS') {
    const carriers = {
      UPS: '1Z',
      FEDEX: 'FDX',
      DHL: 'DHL',
      USPS: 'USPS'
    };
    
    const prefix = carriers[carrier] || 'TRK';
    const random = Math.random().toString(36).substring(2, 12).toUpperCase();
    
    return `${prefix}${random}`;
  }

  /**
   * Générer des données de test
   */
  generateTestData(type, count = 1) {
    const generators = {
      user: this.generateTestUser,
      product: this.generateTestProduct,
      order: this.generateTestOrder,
      address: this.generateTestAddress
    };
    
    const generator = generators[type];
    if (!generator) {
      throw new Error(`Type de données de test non supporté: ${type}`);
    }
    
    if (count === 1) {
      return generator.call(this);
    }
    
    return Array.from({ length: count }, () => generator.call(this));
  }

  /**
   * Générer un utilisateur de test
   */
  generateTestUser() {
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Luc', 'Anne', 'Paul', 'Julie'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand'];
    const domains = ['example.com', 'test.com', 'demo.org'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return {
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      phone: `+33${Math.random().toString().substring(2, 11)}`,
      role: Math.random() > 0.8 ? 'seller' : 'customer'
    };
  }

  /**
   * Générer un produit de test
   */
  generateTestProduct() {
    const categories = ['Électronique', 'Vêtements', 'Maison', 'Sport', 'Loisirs'];
    const brands = ['Sony', 'Nike', 'IKEA', 'Adidas', 'Apple', 'Samsung'];
    const adjectives = ['Super', 'Nouveau', 'Premium', 'Élégant', 'Professionnel', 'Compact'];
    const nouns = ['Téléphone', 'T-shirt', 'Table', 'Ballon', 'Livre', 'Casque'];
    
    const category = categories[Math.floor(Math.random() * categories.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    return {
      name: `${adjective} ${noun} ${brand}`,
      description: `Ceci est un produit ${adjective.toLowerCase()} de la marque ${brand} dans la catégorie ${category}.`,
      price: parseFloat((Math.random() * 1000 + 10).toFixed(2)),
      category: category,
      brand: brand,
      quantity: Math.floor(Math.random() * 100),
      sku: this.generateSKU('TEST')
    };
  }

  /**
   * Générer une commande de test
   */
  generateTestOrder() {
    return {
      order_number: this.generateOrderNumber(),
      status: ['pending', 'confirmed', 'shipped', 'delivered'][Math.floor(Math.random() * 4)],
      total_amount: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      items_count: Math.floor(Math.random() * 5) + 1
    };
  }

  /**
   * Générer une adresse de test
   */
  generateTestAddress() {
    const streets = ['Rue de la Paix', 'Avenue des Champs-Élysées', 'Boulevard Saint-Germain', 'Place de la République'];
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes'];
    
    return {
      street: `${Math.floor(Math.random() * 100) + 1} ${streets[Math.floor(Math.random() * streets.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      postal_code: Math.floor(Math.random() * 90000) + 10000,
      country: 'France',
      type: ['home', 'work', 'billing'][Math.floor(Math.random() * 3)]
    };
  }

  /**
   * Générer des couleurs aléatoires
   */
  generateRandomColors(count = 1, format = 'hex') {
    const colors = [];
    
    for (let i = 0; i < count; i++) {
      const color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      
      if (format === 'rgb') {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        colors.push(`rgb(${r}, ${g}, ${b})`);
      } else {
        colors.push(color);
      }
    }
    
    return count === 1 ? colors[0] : colors;
  }

  /**
   * Générer un gradient CSS
   */
  generateGradient(colors = null, angle = 45) {
    const gradientColors = colors || this.generateRandomColors(2);
    return `linear-gradient(${angle}deg, ${gradientColors.join(', ')})`;
  }

  /**
   * Générer un avatar placeholder
   */
  generateAvatarPlaceholder(name, size = 100, background = null, color = '#fff') {
    const bg = background || this.generateRandomColors(1);
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    
    return {
      background: bg,
      color: color,
      initials: initials,
      size: size,
      url: `https://via.placeholder.com/${size}/${bg.replace('#', '')}/${color.replace('#', '')}?text=${initials}`
    };
  }

  /**
   * Générer des données pour les graphiques
   */
  generateChartData(type = 'line', count = 7, options = {}) {
    const { min = 0, max = 100, labels = null } = options;
    
    const data = Array.from({ length: count }, () => 
      Math.floor(Math.random() * (max - min + 1)) + min
    );
    
    const chartLabels = labels || Array.from({ length: count }, (_, i) => 
      `Jour ${i + 1}`
    );
    
    return {
      labels: chartLabels,
      datasets: [{
        label: options.label || 'Données',
        data: data,
        backgroundColor: options.backgroundColor || this.generateRandomColors(1, 'rgb').replace('rgb', 'rgba').replace(')', ', 0.2)'),
        borderColor: options.borderColor || this.generateRandomColors(1, 'rgb'),
        borderWidth: options.borderWidth || 2
      }]
    };
  }

  /**
   * Générer un mot de passe hashé
   */
  async generateHashedPassword(password = null) {
    const bcrypt = require('bcryptjs');
    const plainPassword = password || this.generatePassword();
    const saltRounds = 12;
    
    const hashed = await bcrypt.hash(plainPassword, saltRounds);
    
    return {
      plain: plainPassword,
      hashed: hashed
    };
  }

  /**
   * Générer un token JWT
   */
  generateJWT(payload, options = {}) {
    const jwt = require('jsonwebtoken');
    const secret = options.secret || config.jwt.secret;
    const expiresIn = options.expiresIn || config.jwt.accessExpiration;
    
    return jwt.sign(payload, secret, {
      expiresIn: expiresIn,
      issuer: options.issuer || config.jwt.issuer,
      audience: options.audience || config.jwt.audience
    });
  }

  /**
   * Générer un QR code data URL
   */
  generateQRCodeDataURL(text, options = {}) {
    const QRCode = require('qrcode');
    
    const defaultOptions = {
      width: options.width || 200,
      height: options.height || 200,
      color: options.color || {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };
    
    return QRCode.toDataURL(text, defaultOptions);
  }

  /**
   * Générer un nom de fichier sécurisé
   */
  generateSafeFileName(originalName, options = {}) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    
    // Nettoyer le nom de base
    let baseName = originalName.split('.').slice(0, -1).join('.');
    baseName = baseName
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, options.maxNameLength || 50);
    
    const fileName = `${baseName}_${timestamp}_${random}.${extension}`;
    
    return options.lowercase ? fileName.toLowerCase() : fileName;
  }

  /**
   * Générer un UUID v4
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Générer un hash de fichier
   */
  generateFileHash(buffer, algorithm = 'md5') {
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }

  /**
   * Générer une signature
   */
  generateSignature(data, secret = config.jwt.secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(data))
      .digest('hex');
  }
}

module.exports = new Generators();
