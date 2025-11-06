const cloudinary = require('cloudinary').v2;
const config = require('./index');
const logger = require('../utils/logger');

class CloudinaryService {
  constructor() {
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      if (!config.cloudinary.cloudName || !config.cloudinary.apiKey || !config.cloudinary.apiSecret) {
        logger.warn('⚠️  Configuration Cloudinary manquante - service désactivé');
        return;
      }

      cloudinary.config({
        cloud_name: config.cloudinary.cloudName,
        api_key: config.cloudinary.apiKey,
        api_secret: config.cloudinary.apiSecret,
        secure: true,
      });

      this.initialized = true;
      logger.info('✅ Service Cloudinary initialisé');

      // Test de connexion
      this.testConnection();

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation de Cloudinary:', error);
      this.initialized = false;
    }
  }

  async testConnection() {
    if (!this.initialized) return;

    try {
      const result = await cloudinary.api.ping();
      logger.info('✅ Connexion Cloudinary établie');
    } catch (error) {
      logger.error('❌ Erreur de connexion Cloudinary:', error);
      this.initialized = false;
    }
  }

  // Upload d'image
  async uploadImage(file, options = {}) {
    if (!this.initialized) {
      throw new Error('Service Cloudinary non initialisé');
    }

    try {
      const uploadOptions = {
        folder: config.cloudinary.folder,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto',
        ...options,
      };

      const result = await cloudinary.uploader.upload(file, uploadOptions);

      logger.info('📸 Image uploadée sur Cloudinary:', {
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        url: result.secure_url,
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
        createdAt: result.created_at,
      };

    } catch (error) {
      logger.error('❌ Erreur d\'upload Cloudinary:', error);
      throw this.handleError(error);
    }
  }

  // Upload multiple d'images
  async uploadMultipleImages(files, options = {}) {
    if (!this.initialized) {
      throw new Error('Service Cloudinary non initialisé');
    }

    try {
      const uploadPromises = files.map(file => this.uploadImage(file, options));
      const results = await Promise.all(uploadPromises);

      logger.info(`📸 ${results.length} images uploadées sur Cloudinary`);
      return results;

    } catch (error) {
      logger.error('❌ Erreur d\'upload multiple Cloudinary:', error);
      throw this.handleError(error);
    }
  }

  // Supprimer une image
  async deleteImage(publicId) {
    if (!this.initialized) {
      throw new Error('Service Cloudinary non initialisé');
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId);

      if (result.result === 'ok') {
        logger.info('🗑️ Image supprimée de Cloudinary:', { publicId });
        return { success: true, publicId };
      } else {
        throw new Error(`Échec de suppression: ${result.result}`);
      }

    } catch (error) {
      logger.error('❌ Erreur de suppression Cloudinary:', error);
      throw this.handleError(error);
    }
  }

  // Générer une URL optimisée
  generateOptimizedUrl(publicId, transformations = {}) {
    if (!this.initialized) {
      throw new Error('Service Cloudinary non initialisé');
    }

    const defaultTransformations = {
      quality: 'auto',
      fetch_format: 'auto',
      ...transformations,
    };

    return cloudinary.url(publicId, {
      ...defaultTransformations,
      secure: true,
    });
  }

  // Générer une URL de thumbnail
  generateThumbnailUrl(publicId, width = 300, height = 300) {
    return this.generateOptimizedUrl(publicId, {
      width,
      height,
      crop: 'fill',
      gravity: 'auto',
    });
  }

  // Générer une URL responsive
  generateResponsiveUrl(publicId, maxWidth = 1200) {
    return this.generateOptimizedUrl(publicId, {
      width: maxWidth,
      crop: 'limit',
    });
  }

  // Upload depuis une URL
  async uploadFromUrl(url, options = {}) {
    if (!this.initialized) {
      throw new Error('Service Cloudinary non initialisé');
    }

    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: config.cloudinary.folder,
        ...options,
      });

      logger.info('🔗 Image uploadée depuis URL:', {
        public_id: result.public_id,
        source: url,
      });

      return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        width: result.width,
        height: result.height,
        size: result.bytes,
      };

    } catch (error) {
      logger.error('❌ Erreur d\'upload depuis URL Cloudinary:', error);
      throw this.handleError(error);
    }
  }

  // Gestion des erreurs Cloudinary
  handleError(error) {
    const cloudinaryError = {
      message: error.message,
      http_code: error.http_code,
      name: error.name,
    };

    logger.error('❌ Erreur Cloudinary:', cloudinaryError);
    return cloudinaryError;
  }

  // Vérifier si le service est initialisé
  isInitialized() {
    return this.initialized;
  }

  // Getter pour le client Cloudinary
  getClient() {
    if (!this.initialized) {
      throw new Error('Service Cloudinary non initialisé');
    }
    return cloudinary;
  }
}

// Instance singleton
const cloudinaryService = new CloudinaryService();

module.exports = cloudinaryService;
