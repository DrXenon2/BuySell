const helmet = require('helmet');
const config = require('./index');

// Configuration Helmet avancée pour la sécurité
const helmetConfig = helmet({
  // Protection XSS
  crossOriginEmbedderPolicy: false,
  
  // Politique de ressources cross-origin
  crossOriginResourcePolicy: { 
    policy: config.env === 'production' ? 'same-site' : 'cross-origin' 
  },
  
  // Politique de sécurité du contenu (CSP)
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://fonts.googleapis.com",
        "https://cdnjs.cloudflare.com"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://js.stripe.com",
        "https://cdnjs.cloudflare.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        `https://${config.cloudinary.cloudName}.cloudinary.com`,
        "https://*.stripe.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdnjs.cloudflare.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "https://checkout.stripe.com",
        `https://${config.supabase.url}`,
        "https://*.cloudinary.com",
        "wss://*.supabase.co"
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      childSrc: ["'self'", "blob:"],
      workerSrc: ["'self'", "blob:"],
      formAction: ["'self'"],
      upgradeInsecureRequests: config.env === 'production' ? [] : null
    },
    reportOnly: config.env === 'development'
  },

  // Protection XSS
  xssFilter: true,

  // Prévention du sniffing MIME
  noSniff: true,

  // Protection clickjacking
  frameguard: { 
    action: 'deny' 
  },

  // Masquer X-Powered-By
  hidePoweredBy: true,

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },

  // Désactiver la mise en cache côté client pour les réponses sensibles
  noCache: false,

  // Référer Policy
  referrerPolicy: { 
    policy: 'strict-origin-when-cross-origin' 
  }
});

// Middleware Helmet personnalisé pour certaines routes
const customHelmet = (req, res, next) => {
  // Appliquer une configuration différente pour les webhooks Stripe
  if (req.path.startsWith('/webhooks/stripe')) {
    // Configuration moins restrictive pour les webhooks
    return helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: false
    })(req, res, next);
  }

  // Configuration standard pour les autres routes
  return helmetConfig(req, res, next);
};

// Configuration spécifique pour les iframes (si nécessaire)
const iframeHelmet = helmet({
  frameguard: { action: 'sameorigin' },
  contentSecurityPolicy: {
    directives: {
      frameSrc: ["'self'", "https://js.stripe.com"]
    }
  }
});

module.exports = {
  helmetConfig: customHelmet,
  iframeHelmet,
  securityHeaders: helmetConfig
};
