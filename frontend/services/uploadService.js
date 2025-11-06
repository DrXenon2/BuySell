import { http, upload } from './api';

class UploadService {
  // Uploader une image unique
  async uploadImage(file, folder = 'general', onProgress = null) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', folder);

      const response = await upload('/uploads/image', formData, onProgress);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Uploader plusieurs images
  async uploadMultipleImages(files, folder = 'general', onProgress = null) {
    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });
      formData.append('folder', folder);

      const response = await upload('/uploads/multiple', formData, onProgress);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Supprimer une image
  async deleteImage(fileName) {
    try {
      const response = await http.delete('/uploads', {
        data: { file_name: fileName }
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Uploader l'avatar utilisateur
  async uploadAvatar(file, onProgress = null) {
    try {
      return await this.uploadImage(file, 'avatars', onProgress);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Uploader les images de produit
  async uploadProductImages(files, onProgress = null) {
    try {
      return await this.uploadMultipleImages(files, 'products', onProgress);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Uploader les images de catégorie
  async uploadCategoryImage(file, onProgress = null) {
    try {
      return await this.uploadImage(file, 'categories', onProgress);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Uploader les images de review
  async uploadReviewImages(files, onProgress = null) {
    try {
      return await this.uploadMultipleImages(files, 'reviews', onProgress);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Valider un fichier avant upload
  validateFile(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB par défaut
      allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      maxFiles = 10
    } = options;

    const errors = [];

    // Vérifier la taille
    if (file.size > maxSize) {
      errors.push(`Le fichier ${file.name} est trop volumineux (max: ${maxSize / 1024 / 1024}MB)`);
    }

    // Vérifier le type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Type de fichier non supporté: ${file.name}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Optimiser une image avant upload
  async optimizeImage(file, options = {}) {
    return new Promise((resolve, reject) => {
      const {
        maxWidth = 1200,
        maxHeight = 1200,
        quality = 0.8
      } = options;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions
        let { width, height } = img;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        // Redimensionner
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Erreur lors de l\'optimisation de l\'image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Erreur de chargement de l\'image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Générer une URL d'image optimisée (pour Cloudinary)
  generateOptimizedImageUrl(url, options = {}) {
    const {
      width = 800,
      height,
      quality = 'auto',
      format = 'auto'
    } = options;

    if (!url || !url.includes('cloudinary.com')) {
      return url;
    }

    const transformations = [];
    
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);

    if (transformations.length === 0) {
      return url;
    }

    // Insérer les transformations dans l'URL Cloudinary
    const parts = url.split('/upload/');
    if (parts.length === 2) {
      return `${parts[0]}/upload/${transformations.join(',')}/${parts[1]}`;
    }

    return url;
  }

  // Gestion centralisée des erreurs
  handleError(error) {
    console.error('Upload Service Error:', error);
    
    const uploadErrors = {
      'File too large': 'Fichier trop volumineux',
      'Invalid file type': 'Type de fichier non supporté',
      'Upload failed': 'Échec de l\'upload',
      'Network error': 'Erreur réseau lors de l\'upload',
    };

    const message = uploadErrors[error.message] || 
                   error.message || 
                   'Erreur lors de l\'upload du fichier';

    return {
      success: false,
      error: error.error || 'Upload Service Error',
      message,
      status: error.status,
      originalError: error,
    };
  }
}

export default new UploadService();
