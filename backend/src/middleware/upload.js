const multer = require('multer');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Configuration du stockage
 */
const storage = multer.memoryStorage();

/**
 * Filtre de validation des fichiers
 */
const fileFilter = (req, file, cb) => {
  // Vérifier le type MIME
  if (!config.upload.allowedMimeTypes.includes(file.mimetype)) {
    const error = new Error(`Type de fichier non autorisé: ${file.mimetype}`);
    error.code = 'FILE_TYPE_NOT_ALLOWED';
    return cb(error, false);
  }

  // Vérifier la taille du fichier
  if (file.size > config.upload.maxFileSize) {
    const error = new Error(`Fichier trop volumineux: ${file.size} bytes. Maximum: ${config.upload.maxFileSize} bytes`);
    error.code = 'FILE_TOO_LARGE';
    return cb(error, false);
  }

  cb(null, true);
};

/**
 * Configuration Multer
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10 // Maximum 10 fichiers
  }
});

/**
 * Middleware d'upload générique
 */
const uploadMiddleware = upload;

/**
 * Middleware pour valider les fichiers après upload
 */
const validateFile = (req, res, next) => {
  if (!req.file && !req.files) {
    return next();
  }

  const files = req.file ? [req.file] : req.files;

  for (const file of files) {
    // Validation supplémentaire si nécessaire
    if (file.mimetype.startsWith('image/')) {
      // Vérifier les dimensions si c'est une image
      // Cette vérification se fera dans le controller après le téléchargement
    }
  }

  logger.debug('Fichiers validés:', { 
    count: files.length,
    names: files.map(f => f.originalname)
  });

  next();
};

/**
 * Gestionnaire d'erreurs pour Multer
 */
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'Erreur lors de l\'upload du fichier';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = `Fichier trop volumineux. Maximum: ${config.upload.maxFileSize / 1024 / 1024}MB`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Trop de fichiers uploadés';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Champ de fichier inattendu';
        break;
      default:
        message = `Erreur d'upload: ${error.message}`;
    }

    logger.warn('Erreur Multer:', { error: error.message, code: error.code });

    return res.status(400).json({
      success: false,
      error: 'Erreur d\'upload',
      message: message
    });
  }

  if (error.code === 'FILE_TYPE_NOT_ALLOWED' || error.code === 'FILE_TOO_LARGE') {
    return res.status(400).json({
      success: false,
      error: 'Fichier invalide',
      message: error.message
    });
  }

  next(error);
};

/**
 * Middleware pour générer un nom de fichier sécurisé
 */
const generateFilename = (originalname, userId) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalname);
  const name = path.basename(originalname, extension);
  
  // Sanitizer le nom du fichier
  const safeName = name.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
  
  return `${userId}_${timestamp}_${randomString}_${safeName}${extension}`.toLowerCase();
};

module.exports = {
  uploadMiddleware,
  validateFile,
  handleUploadError,
  generateFilename
};
