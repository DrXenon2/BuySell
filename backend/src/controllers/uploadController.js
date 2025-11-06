
const supabase = require('../config/supabase');
const logger = require('../utils/logger');

class UploadController {
  // Upload d'image unique
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Fichier manquant',
          message: 'Aucun fichier n\'a été uploadé'
        });
      }

      const file = req.file;
      const userId = req.user.id;
      const { folder = 'general' } = req.body;

      // Validation du type de fichier
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          error: 'Type de fichier non supporté',
          message: 'Seules les images JPEG, PNG, WebP et GIF sont autorisées'
        });
      }

      // Validation de la taille (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({
          error: 'Fichier trop volumineux',
          message: 'La taille maximale autorisée est de 5MB'
        });
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${userId}_${timestamp}_${randomString}.${fileExtension}`;

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      logger.info('Image uploadée', { 
        userId,
        fileName,
        size: file.size 
      });

      res.json({
        success: true,
        message: 'Image uploadée avec succès',
        data: {
          file_name: fileName,
          public_url: publicUrl,
          size: file.size,
          mime_type: file.mimetype
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur uploadImage:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'upload de l\'image'
      });
    }
  }

  // Upload multiple d'images
  async uploadMultipleImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          error: 'Fichiers manquants',
          message: 'Aucun fichier n\'a été uploadé'
        });
      }

      const files = req.files;
      const userId = req.user.id;
      const { folder = 'general' } = req.body;

      // Limiter le nombre de fichiers
      const maxFiles = 10;
      if (files.length > maxFiles) {
        return res.status(400).json({
          error: 'Trop de fichiers',
          message: `Maximum ${maxFiles} fichiers autorisés`
        });
      }

      const uploadResults = [];
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024;

      for (const file of files) {
        try {
          // Validation
          if (!allowedMimeTypes.includes(file.mimetype)) {
            uploadResults.push({
              file_name: file.originalname,
              success: false,
              error: 'Type de fichier non supporté'
            });
            continue;
          }

          if (file.size > maxSize) {
            uploadResults.push({
              file_name: file.originalname,
              success: false,
              error: 'Fichier trop volumineux'
            });
            continue;
          }

          // Générer un nom de fichier unique
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileExtension = file.originalname.split('.').pop();
          const fileName = `${folder}/${userId}_${timestamp}_${randomString}.${fileExtension}`;

          // Upload
          const { data, error } = await supabase.storage
            .from('uploads')
            .upload(fileName, file.buffer, {
              contentType: file.mimetype,
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            uploadResults.push({
              file_name: file.originalname,
              success: false,
              error: error.message
            });
            continue;
          }

          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName);

          uploadResults.push({
            file_name: file.originalname,
            success: true,
            data: {
              file_name: fileName,
              public_url: publicUrl,
              size: file.size,
              mime_type: file.mimetype
            }
          });

        } catch (fileError) {
          uploadResults.push({
            file_name: file.originalname,
            success: false,
            error: fileError.message
          });
        }
      }

      logger.info('Images multiples uploadées', { 
        userId,
        total: files.length,
        successful: uploadResults.filter(r => r.success).length 
      });

      res.json({
        success: true,
        message: 'Upload multiple terminé',
        data: { results: uploadResults }
      });

    } catch (error) {
      logger.error('Erreur contrôleur uploadMultipleImages:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'upload multiple des images'
      });
    }
  }

  // Supprimer une image
  async deleteImage(req, res) {
    try {
      const { file_name } = req.body;
      const userId = req.user.id;

      if (!file_name) {
        return res.status(400).json({
          error: 'Nom de fichier manquant',
          message: 'Le nom du fichier à supprimer est requis'
        });
      }

      // Vérifier que l'utilisateur a le droit de supprimer ce fichier
      // (optionnel: vérifier si le fichier appartient à l'utilisateur)
      if (!file_name.includes(userId) && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Permission refusée',
          message: 'Vous ne pouvez supprimer que vos propres fichiers'
        });
      }

      const { data, error } = await supabase.storage
        .from('uploads')
        .remove([file_name]);

      if (error) {
        throw error;
      }

      logger.info('Image supprimée', { 
        userId,
        file_name 
      });

      res.json({
        success: true,
        message: 'Image supprimée avec succès'
      });

    } catch (error) {
      logger.error('Erreur contrôleur deleteImage:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression de l\'image'
      });
    }
  }

  // Obtenir la liste des fichiers de l'utilisateur
  async getUserFiles(req, res) {
    try {
      const userId = req.user.id;
      const { folder, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      let query = supabase.storage
        .from('uploads')
        .list(folder || '', {
          limit: limit,
          offset: offset,
          sortBy: { column: 'name', order: 'desc' }
        });

      const { data: files, error } = await query;

      if (error) {
        throw error;
      }

      // Filtrer les fichiers de l'utilisateur (optionnel)
      const userFiles = files.filter(file => 
        file.name.includes(userId) || req.user.role === 'admin'
      );

      // Générer les URLs publiques
      const filesWithUrls = userFiles.map(file => ({
        ...file,
        public_url: supabase.storage.from('uploads').getPublicUrl(file.name).data.publicUrl
      }));

      res.json({
        success: true,
        data: {
          files: filesWithUrls,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur contrôleur getUserFiles:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des fichiers'
      });
    }
  }
}

module.exports = new UploadController();
