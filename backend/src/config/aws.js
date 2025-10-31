const AWS = require('aws-sdk');
const config = require('./index');
const logger = require('../utils/logger');

class AwsService {
  constructor() {
    this.s3 = null;
    this.ses = null;
    this.initialized = false;
    this.init();
  }

  init() {
    try {
      // Configuration AWS
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
      });

      // Vérification des credentials
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
        logger.warn('⚠️  Credentials AWS manquants - service désactivé');
        return;
      }

      // Initialisation des services
      this.s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        signatureVersion: 'v4',
        maxRetries: 3,
        httpOptions: {
          timeout: 10000,
          connectTimeout: 5000
        }
      });

      this.ses = new AWS.SES({
        apiVersion: '2010-12-01'
      });

      this.initialized = true;
      logger.info('✅ Service AWS initialisé');

      // Test de connexion
      this.testConnection();

    } catch (error) {
      logger.error('❌ Erreur lors de l\'initialisation d\'AWS:', error);
      this.initialized = false;
    }
  }

  async testConnection() {
    if (!this.initialized) return;

    try {
      await this.s3.listBuckets().promise();
      logger.info('✅ Connexion AWS S3 établie');
    } catch (error) {
      logger.error('❌ Erreur de connexion AWS S3:', error);
      this.initialized = false;
    }
  }

  // S3 - Upload de fichier
  async uploadToS3(file, key, bucket = null) {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const bucketName = bucket || process.env.AWS_S3_BUCKET;
      
      if (!bucketName) {
        throw new Error('Nom du bucket S3 non configuré');
      }

      const params = {
        Bucket: bucketName,
        Key: key,
        Body: file.buffer || file,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: {
          uploadedBy: 'buysell-platform',
          timestamp: new Date().toISOString()
        }
      };

      const result = await this.s3.upload(params).promise();

      logger.info('📁 Fichier uploadé sur S3:', {
        key: result.Key,
        bucket: result.Bucket,
        size: result.ContentLength,
        location: result.Location
      });

      return {
        key: result.Key,
        bucket: result.Bucket,
        location: result.Location,
        etag: result.ETag,
        size: result.ContentLength
      };

    } catch (error) {
      logger.error('❌ Erreur d\'upload S3:', error);
      throw this.handleError(error);
    }
  }

  // S3 - Générer une URL signée
  async getSignedUrl(key, operation = 'getObject', expires = 3600) {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
        Expires: expires
      };

      const url = await this.s3.getSignedUrlPromise(operation, params);

      logger.info('🔗 URL signée générée:', {
        key,
        operation,
        expiresIn: `${expires}s`
      });

      return url;

    } catch (error) {
      logger.error('❌ Erreur de génération d\'URL signée:', error);
      throw this.handleError(error);
    }
  }

  // S3 - Supprimer un fichier
  async deleteFromS3(key, bucket = null) {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const bucketName = bucket || process.env.AWS_S3_BUCKET;
      
      const params = {
        Bucket: bucketName,
        Key: key
      };

      await this.s3.deleteObject(params).promise();

      logger.info('🗑️ Fichier supprimé de S3:', { key, bucket: bucketName });

      return { success: true, key };

    } catch (error) {
      logger.error('❌ Erreur de suppression S3:', error);
      throw this.handleError(error);
    }
  }

  // S3 - Lister les fichiers
  async listFiles(prefix = '', maxKeys = 1000) {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const params = {
        Bucket: process.env.AWS_S3_BUCKET,
        Prefix: prefix,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();

      logger.info('📋 Fichiers listés sur S3:', {
        prefix,
        count: result.Contents?.length || 0
      });

      return result.Contents || [];

    } catch (error) {
      logger.error('❌ Erreur de listing S3:', error);
      throw this.handleError(error);
    }
  }

  // SES - Envoyer un email
  async sendEmail(to, subject, body, from = null) {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const sender = from || process.env.AWS_SES_FROM_EMAIL || 'noreply@buysell.com';

      const params = {
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: body.html || body
            },
            Text: {
              Charset: 'UTF-8',
              Data: body.text || body
            }
          },
          Subject: {
            Charset: 'UTF-8',
            Data: subject
          }
        },
        Source: sender,
        ReplyToAddresses: [sender]
      };

      const result = await this.ses.sendEmail(params).promise();

      logger.info('📧 Email envoyé via SES:', {
        to,
        subject,
        messageId: result.MessageId
      });

      return {
        messageId: result.MessageId,
        success: true
      };

    } catch (error) {
      logger.error('❌ Erreur d\'envoi d\'email SES:', error);
      throw this.handleError(error);
    }
  }

  // SES - Envoyer un email template
  async sendTemplatedEmail(to, templateName, templateData, from = null) {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const sender = from || process.env.AWS_SES_FROM_EMAIL;

      const params = {
        Destination: {
          ToAddresses: Array.isArray(to) ? to : [to]
        },
        Template: templateName,
        TemplateData: JSON.stringify(templateData),
        Source: sender
      };

      const result = await this.ses.sendTemplatedEmail(params).promise();

      logger.info('📧 Email template envoyé via SES:', {
        to,
        template: templateName,
        messageId: result.MessageId
      });

      return {
        messageId: result.MessageId,
        success: true
      };

    } catch (error) {
      logger.error('❌ Erreur d\'envoi d\'email template SES:', error);
      throw this.handleError(error);
    }
  }

  // SES - Vérifier l'état de l'email
  async getSendStatistics() {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }

    try {
      const result = await this.ses.getSendStatistics().promise();
      return result.SendDataPoints;

    } catch (error) {
      logger.error('❌ Erreur de récupération des statistiques SES:', error);
      throw this.handleError(error);
    }
  }

  // Gestion des erreurs AWS
  handleError(error) {
    const awsError = {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
      time: error.time
    };

    logger.error('❌ Erreur AWS:', awsError);
    return awsError;
  }

  // Vérifier si le service est initialisé
  isInitialized() {
    return this.initialized;
  }

  // Getters pour les clients AWS
  getS3() {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }
    return this.s3;
  }

  getSES() {
    if (!this.initialized) {
      throw new Error('Service AWS non initialisé');
    }
    return this.ses;
  }
}

// Instance singleton
const awsService = new AwsService();

module.exports = awsService;
