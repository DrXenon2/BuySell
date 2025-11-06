const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');
const config = require('../config');
const logger = require('../utils/logger');

class StorageService {
  constructor() {
    this.supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);
    this.bucketName = 'uploads';
    this.allowedMimeTypes = config.upload.allowedMimeTypes;
    this.maxFileSize = config.upload.maxFileSize;
  }

  /**
   * Uploader un fichier unique
   */
  async uploadFile(file, options = {}) {
    try {
      const {
        folder = 'general',
        userId = 'system',
        resize = null,
        quality = 85,
        generateThumbnail = false
      } = options;

      // Valider le fichier
      this.validateFile(file);

      // Générer un nom de fichier sécurisé
      const fileName = this.generateFileName(file.originalname, userId, folder);
      
      let fileBuffer = file.buffer;
      let mimeType = file.mimetype;

      // Traitement des images
      if (this.isImage(file)) {
        fileBuffer = await this.processImage(fileBuffer, { resize, quality });
        mimeType = 'image/webp'; // Convertir en WebP par défaut
      }

      // Upload vers Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileBuffer, {
          contentType: mimeType,
          cacheControl: '3600',
          upsert: false,
          duplex: 'half'
        });

      if (error) {
        throw new Error(`Erreur upload: ${error.message}`);
      }

      // Générer une miniature si demandé
      let thumbnailUrl = null;
      if (generateThumbnail && this.isImage(file)) {
        thumbnailUrl = await this.generateThumbnail(file.buffer, fileName, userId, folder);
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      const fileInfo = {
        id: data.id,
        file_name: fileName,
        original_name: file.originalname,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        size: fileBuffer.length,
        mime_type: mimeType,
        folder: folder,
        uploaded_by: userId,
        uploaded_at: new Date()
      };

      logger.info('Fichier uploadé avec succès', {
        fileName,
        size: fileBuffer.length,
        userId
      });

      return fileInfo;

    } catch (error) {
      logger.error('Erreur service storage uploadFile:', error);
      throw error;
    }
  }

  /**
   * Uploader plusieurs fichiers
   */
  async uploadMultipleFiles(files, options = {}) {
    try {
      const results = [];

      for (const file of files) {
        try {
          const result = await this.uploadFile(file, options);
          results.push({
            success: true,
            data: result
          });
        } catch (error) {
          results.push({
            success: false,
            file_name: file.originalname,
            error: error.message
          });
        }
      }

      return {
        total: files.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      };

    } catch (error) {
      logger.error('Erreur service storage uploadMultipleFiles:', error);
      throw error;
    }
  }

  /**
   * Supprimer un fichier
   */
  async deleteFile(fileName) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        throw new Error(`Erreur suppression: ${error.message}`);
      }

      logger.info('Fichier supprimé', { fileName });

      return { success: true, data };

    } catch (error) {
      logger.error('Erreur service storage deleteFile:', error);
      throw error;
    }
  }

  /**
   * Obtenir la liste des fichiers
   */
  async listFiles(options = {}) {
    try {
      const {
        folder = '',
        limit = 100,
        offset = 0,
        sortBy = 'name',
        sortOrder = 'asc'
      } = options;

      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: sortBy, order: sortOrder }
        });

      if (error) {
        throw new Error(`Erreur liste fichiers: ${error.message}`);
      }

      // Ajouter les URLs publiques
      const filesWithUrls = data.map(file => ({
        ...file,
        public_url: this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(`${folder ? folder + '/' : ''}${file.name}`).data.publicUrl
      }));

      return filesWithUrls;

    } catch (error) {
      logger.error('Erreur service storage listFiles:', error);
      throw error;
    }
  }

  /**
   * Obtenir les informations d'un fichier
   */
  async getFileInfo(fileName) {
    try {
      // Récupérer les métadonnées du fichier
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(fileName);

      if (error) {
        throw new Error(`Erreur info fichier: ${error.message}`);
      }

      // Obtenir plus d'informations via la liste
      const folder = fileName.split('/').slice(0, -1).join('/');
      const name = fileName.split('/').pop();
      
      const { data: files } = await this.supabase.storage
        .from(this.bucketName)
        .list(folder, {
          search: name
        });

      const fileInfo = files?.find(f => f.name === name);

      return {
        ...fileInfo,
        public_url: data.publicUrl,
        download_url: this.supabase.storage
          .from(this.bucketName)
          .getPublicUrl(fileName, { download: true }).data.publicUrl
      };

    } catch (error) {
      logger.error('Erreur service storage getFileInfo:', error);
      throw error;
    }
  }

  /**
   * Télécharger un fichier
   */
  async downloadFile(fileName) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(fileName);

      if (error) {
        throw new Error(`Erreur téléchargement: ${error.message}`);
      }

      return data;

    } catch (error) {
      logger.error('Erreur service storage downloadFile:', error);
      throw error;
    }
  }

  /**
   * Copier un fichier
   */
  async copyFile(sourceFileName, destinationFileName) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .copy(sourceFileName, destinationFileName);

      if (error) {
        throw new Error(`Erreur copie: ${error.message}`);
      }

      logger.info('Fichier copié', {
        source: sourceFileName,
        destination: destinationFileName
      });

      return data;

    } catch (error) {
      logger.error('Erreur service storage copyFile:', error);
      throw error;
    }
  }

  /**
   * Déplacer un fichier
   */
  async moveFile(sourceFileName, destinationFileName) {
    try {
      // Copier le fichier
      await this.copyFile(sourceFileName, destinationFileName);
      
      // Supprimer l'original
      await this.deleteFile(sourceFileName);

      logger.info('Fichier déplacé', {
        source: sourceFileName,
        destination: destinationFileName
      });

      return { success: true };

    } catch (error) {
      logger.error('Erreur service storage moveFile:', error);
      throw error;
    }
  }

  /**
   * Créer un dossier
   */
  async createFolder(folderName) {
    try {
      // Dans Supabase Storage, les dossiers sont créés automatiquement lors de l'upload
      // On peut simuler la création en uploadant un fichier vide
      const dummyFileName = `${folderName}/.keep`;
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(dummyFileName, Buffer.from(''), {
          contentType: 'text/plain'
        });

      if (error && !error.message.includes('already exists')) {
        throw new Error(`Erreur création dossier: ${error.message}`);
      }

      logger.info('Dossier créé', { folderName });

      return { success: true };

    } catch (error) {
      logger.error('Erreur service storage createFolder:', error);
      throw error;
    }
  }

  /**
   * Supprimer un dossier
   */
  async deleteFolder(folderName) {
    try {
      // Lister tous les fichiers du dossier
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.bucketName)
        .list(folderName);

      if (listError) {
        throw new Error(`Erreur liste dossier: ${listError.message}`);
      }

      // Supprimer tous les fichiers
      const fileNames = files.map(file => `${folderName}/${file.name}`);
      
      if (fileNames.length > 0) {
        const { error: deleteError } = await this.supabase.storage
          .from(this.bucketName)
          .remove(fileNames);

        if (deleteError) {
          throw new Error(`Erreur suppression dossier: ${deleteError.message}`);
        }
      }

      logger.info('Dossier supprimé', { folderName, filesDeleted: fileNames.length });

      return { success: true, filesDeleted: fileNames.length };

    } catch (error) {
      logger.error('Erreur service storage deleteFolder:', error);
      throw error;
    }
  }

  /**
   * Traitement d'image avec Sharp
   */
  async processImage(buffer, options = {}) {
    try {
      let image = sharp(buffer);

      // Redimensionnement
      if (options.resize) {
        const { width, height, fit = 'inside' } = options.resize;
        image = image.resize(width, height, {
          fit,
          withoutEnlargement: true
        });
      }

      // Qualité et format
      image = image.webp({ 
        quality: options.quality || 85,
        effort: 6
      });

      return await image.toBuffer();

    } catch (error) {
      logger.error('Erreur traitement image:', error);
      throw new Error('Erreur lors du traitement de l\'image');
    }
  }

  /**
   * Générer une miniature
   */
  async generateThumbnail(buffer, originalFileName, userId, folder) {
    try {
      const thumbnailBuffer = await sharp(buffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 70 })
        .toBuffer();

      const thumbnailName = originalFileName.replace(/\.(\w+)$/, '_thumb.webp');

      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(thumbnailName, thumbnailBuffer, {
          contentType: 'image/webp',
          cacheControl: '3600'
        });

      if (error) {
        logger.warn('Erreur génération miniature:', error);
        return null;
      }

      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucketName)
        .getPublicUrl(thumbnailName);

      return publicUrl;

    } catch (error) {
      logger.error('Erreur génération miniature:', error);
      return null;
    }
  }

  /**
   * Valider un fichier
   */
  validateFile(file) {
    // Type MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`Type de fichier non autorisé: ${file.mimetype}`);
    }

    // Taille
    if (file.size > this.maxFileSize) {
      throw new Error(`Fichier trop volumineux: ${file.size} bytes. Maximum: ${this.maxFileSize} bytes`);
    }

    // Nom de fichier
    if (!file.originalname || file.originalname.length > 255) {
      throw new Error('Nom de fichier invalide');
    }
  }

  /**
   * Vérifier si c'est une image
   */
  isImage(file) {
    return file.mimetype.startsWith('image/');
  }

  /**
   * Générer un nom de fichier sécurisé
   */
  generateFileName(originalName, userId, folder) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    const name = originalName.split('.').slice(0, -1).join('.');
    
    // Nettoyer le nom
    const cleanName = name
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 50)
      .toLowerCase();

    const fileName = `${cleanName}_${timestamp}_${randomString}.webp`;

    return folder ? `${folder}/${fileName}` : fileName;
  }

  /**
   * Obtenir les statistiques de stockage
   */
  async getStorageStats() {
    try {
      // Cette fonctionnalité peut nécessiter une implémentation personnalisée
      // car Supabase ne fournit pas d'API directe pour les statistiques de stockage
      
      const allFiles = await this.listFiles({ limit: 1000 });
      
      const totalSize = allFiles.reduce((sum, file) => sum + (file.metadata?.size || 0), 0);
      const totalFiles = allFiles.length;

      // Regrouper par type
      const filesByType = allFiles.reduce((acc, file) => {
        const type = file.metadata?.mimetype?.split('/')[0] || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Regrouper par dossier
      const filesByFolder = allFiles.reduce((acc, file) => {
        const folder = file.name.split('/').slice(0, -1).join('/') || 'root';
        acc[folder] = (acc[folder] || 0) + 1;
        return acc;
      }, {});

      return {
        total_files: totalFiles,
        total_size: totalSize,
        files_by_type: filesByType,
        files_by_folder: filesByFolder,
        bucket_name: this.bucketName
      };

    } catch (error) {
      logger.error('Erreur service storage getStorageStats:', error);
      throw error;
    }
  }

  /**
   * Nettoyer les fichiers temporaires
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

      const tempFiles = await this.listFiles({ folder: 'temp' });
      const oldFiles = tempFiles.filter(file => {
        const fileTime = new Date(file.created_at);
        return fileTime < cutoffTime;
      });

      if (oldFiles.length === 0) {
        return { cleaned: 0 };
      }

      const fileNames = oldFiles.map(file => `temp/${file.name}`);
      
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove(fileNames);

      if (error) {
        throw new Error(`Erreur nettoyage: ${error.message}`);
      }

      logger.info('Fichiers temporaires nettoyés', {
        count: oldFiles.length,
        maxAgeHours
      });

      return { cleaned: oldFiles.length };

    } catch (error) {
      logger.error('Erreur service storage cleanupTempFiles:', error);
      throw error;
    }
  }

  /**
   * Générer une URL signée (pour accès privé)
   */
  async createSignedUrl(fileName, expiresIn = 3600) {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .createSignedUrl(fileName, expiresIn);

      if (error) {
        throw new Error(`Erreur URL signée: ${error.message}`);
      }

      return data;

    } catch (error) {
      logger.error('Erreur service storage createSignedUrl:', error);
      throw error;
    }
  }
}

module.exports = new StorageService();
