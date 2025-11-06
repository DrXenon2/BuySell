/**
 * Configuration et setup de la documentation Swagger
 */

const config = require('../../config');
const { specs, swaggerUi, swaggerUiOptions } = require('./index');

/**
 * Middleware de protection basique pour la documentation
 */
const setupSwaggerAuth = (app) => {
  if (config.docs.auth.enabled && config.env === 'production') {
    const basicAuth = require('express-basic-auth');
    
    app.use(config.docs.route, basicAuth({
      users: { 
        [config.docs.auth.username]: config.docs.auth.password 
      },
      challenge: true,
      realm: 'BuySell Platform API Documentation'
    }));
  }
};

/**
 * Setup complet de la documentation Swagger
 */
const setupSwaggerDocs = (app) => {
  if (!config.docs.enabled) {
    console.log('📚 Documentation Swagger désactivée');
    return;
  }

  try {
    // Configuration de l'authentification
    setupSwaggerAuth(app);
    
    // Servir la documentation Swagger UI
    app.use(
      config.docs.route,
      swaggerUi.serve,
      swaggerUi.setup(specs, {
        ...swaggerUiOptions,
        ...config.docs.options
      })
    );
    
    // Endpoint JSON brut pour outils externes
    app.get('/api/docs-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(specs);
    });
    
    // Endpoint YAML
    app.get('/api/docs-yaml', (req, res) => {
      res.setHeader('Content-Type', 'application/yaml');
      // Vous pouvez ajouter une conversion vers YAML ici si nécessaire
      res.send(specs);
    });
    
    console.log(`📚 Documentation Swagger disponible sur ${config.app.backendUrl}${config.docs.route}`);
    console.log(`📋 Documentation JSON disponible sur ${config.app.backendUrl}/api/docs-json`);
    
  } catch (error) {
    console.error('❌ Erreur lors du setup de la documentation Swagger:', error);
    throw error;
  }
};

module.exports = {
  setupSwaggerDocs,
  setupSwaggerAuth,
  specs
};
