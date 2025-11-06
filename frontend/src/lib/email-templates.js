/**
 * Système de templates d'emails pour BuySell Platform
 * Templates responsives et professionnels
 */

import { APP_CONFIG } from '../config/app';

// Configuration des emails
const EMAIL_CONFIG = {
  company: {
    name: 'BuySell Platform',
    address: '123 Avenue des Champs-Élysées, 75008 Paris, France',
    phone: '+33 1 23 45 67 89',
    email: 'support@buysell.com',
    website: APP_CONFIG.urls.frontend,
    logo: `${APP_CONFIG.urls.frontend}/images/logo-email.png`,
    social: {
      facebook: 'https://facebook.com/buysellplatform',
      twitter: 'https://twitter.com/buysellplatform',
      instagram: 'https://instagram.com/buysellplatform',
      linkedin: 'https://linkedin.com/company/buysellplatform',
    },
  },
  colors: {
    primary: '#667eea',
    secondary: '#764ba2',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    light: '#f8fafc',
    dark: '#1e293b',
    text: '#374151',
    muted: '#6b7280',
  },
  fonts: {
    primary: 'Arial, Helvetica, sans-serif',
    heading: 'Georgia, serif',
  },
};

// Template de base pour tous les emails
const BASE_TEMPLATE = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{subject}}</title>
  <style>
    /* Reset CSS */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: ${EMAIL_CONFIG.fonts.primary};
      line-height: 1.6;
      color: ${EMAIL_CONFIG.colors.text};
      background-color: #f9fafb;
      -webkit-font-smoothing: antialiased;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }
    
    .email-header {
      background: linear-gradient(135deg, ${EMAIL_CONFIG.colors.primary}, ${EMAIL_CONFIG.colors.secondary});
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    
    .email-logo {
      max-width: 150px;
      height: auto;
      margin-bottom: 20px;
    }
    
    .email-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
      font-family: ${EMAIL_CONFIG.fonts.heading};
    }
    
    .email-subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    
    .email-content {
      padding: 40px 30px;
    }
    
    .email-section {
      margin-bottom: 30px;
    }
    
    .email-section:last-child {
      margin-bottom: 0;
    }
    
    .email-section-title {
      font-size: 20px;
      font-weight: bold;
      color: ${EMAIL_CONFIG.colors.dark};
      margin-bottom: 15px;
      font-family: ${EMAIL_CONFIG.fonts.heading};
    }
    
    .email-text {
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 15px;
    }
    
    .email-button {
      display: inline-block;
      padding: 14px 28px;
      background: linear-gradient(135deg, ${EMAIL_CONFIG.colors.primary}, ${EMAIL_CONFIG.colors.secondary});
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: all 0.3s ease;
    }
    
    .email-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .email-button-secondary {
      background: ${EMAIL_CONFIG.colors.light};
      color: ${EMAIL_CONFIG.colors.text};
      border: 1px solid #e5e7eb;
    }
    
    .email-button-secondary:hover {
      background: #f3f4f6;
      transform: none;
      box-shadow: none;
    }
    
    .email-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 30px 0;
    }
    
    .email-footer {
      background: ${EMAIL_CONFIG.colors.light};
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    
    .email-social {
      margin-bottom: 20px;
    }
    
    .email-social-link {
      display: inline-block;
      margin: 0 10px;
      color: ${EMAIL_CONFIG.colors.muted};
      text-decoration: none;
      font-size: 14px;
    }
    
    .email-social-link:hover {
      color: ${EMAIL_CONFIG.colors.primary};
    }
    
    .email-legal {
      font-size: 12px;
      color: ${EMAIL_CONFIG.colors.muted};
      line-height: 1.5;
    }
    
    .email-legal a {
      color: ${EMAIL_CONFIG.colors.muted};
      text-decoration: underline;
    }
    
    /* Responsive */
    @media (max-width: 600px) {
      .email-container {
        margin: 10px;
        border-radius: 8px;
      }
      
      .email-header,
      .email-content {
        padding: 30px 20px;
      }
      
      .email-title {
        font-size: 24px;
      }
      
      .email-button {
        display: block;
        width: 100%;
      }
    }
    
    /* Utilities */
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .mb-0 { margin-bottom: 0; }
    .mb-1 { margin-bottom: 10px; }
    .mb-2 { margin-bottom: 20px; }
    .mb-3 { margin-bottom: 30px; }
    .mt-1 { margin-top: 10px; }
    .mt-2 { margin-top: 20px; }
    .mt-3 { margin-top: 30px; }
    
    /* Order specific styles */
    .order-summary {
      background: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .order-item:last-child {
      border-bottom: none;
    }
    
    .order-item-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 6px;
      margin-right: 15px;
    }
    
    .order-item-details {
      flex: 1;
    }
    
    .order-item-name {
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .order-item-price {
      color: ${EMAIL_CONFIG.colors.muted};
      font-size: 14px;
    }
    
    .order-total {
      font-size: 18px;
      font-weight: bold;
      text-align: right;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
    }
    
    /* Alert styles */
    .alert {
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
      border-left: 4px solid;
    }
    
    .alert-success {
      background: #f0fdf4;
      border-left-color: ${EMAIL_CONFIG.colors.success};
      color: #065f46;
    }
    
    .alert-warning {
      background: #fffbeb;
      border-left-color: ${EMAIL_CONFIG.colors.warning};
      color: #92400e;
    }
    
    .alert-error {
      background: #fef2f2;
      border-left-color: ${EMAIL_CONFIG.colors.error};
      color: #991b1b;
    }
    
    .alert-info {
      background: #eff6ff;
      border-left-color: ${EMAIL_CONFIG.colors.primary};
      color: #1e40af;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      {{#if logo}}
      <img src="{{logo}}" alt="${EMAIL_CONFIG.company.name}" class="email-logo">
      {{/if}}
      <h1 class="email-title">{{title}}</h1>
      {{#if subtitle}}
      <p class="email-subtitle">{{subtitle}}</p>
      {{/if}}
    </div>
    
    <div class="email-content">
      {{{content}}}
    </div>
    
    <div class="email-footer">
      <div class="email-social">
        <a href="${EMAIL_CONFIG.company.social.facebook}" class="email-social-link">Facebook</a>
        <a href="${EMAIL_CONFIG.company.social.twitter}" class="email-social-link">Twitter</a>
        <a href="${EMAIL_CONFIG.company.social.instagram}" class="email-social-link">Instagram</a>
        <a href="${EMAIL_CONFIG.company.social.linkedin}" class="email-social-link">LinkedIn</a>
      </div>
      <div class="email-legal">
        <p>&copy; ${new Date().getFullYear()} ${EMAIL_CONFIG.company.name}. Tous droits réservés.</p>
        <p>
          <a href="${EMAIL_CONFIG.urls.frontend}/privacy">Politique de confidentialité</a> | 
          <a href="${EMAIL_CONFIG.urls.frontend}/terms">Conditions d'utilisation</a>
        </p>
        <p>
          ${EMAIL_CONFIG.company.address}<br>
          ${EMAIL_CONFIG.company.phone} | ${EMAIL_CONFIG.company.email}
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

// Fonction de template simple
const renderTemplate = (template, data) => {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    return data[key.trim()] || '';
  });
};

/**
 * TEMPLATE: Email de bienvenue
 */
export const generateWelcomeEmail = (user) => {
  const data = {
    subject: `Bienvenue sur ${EMAIL_CONFIG.company.name} ! 🎉`,
    title: 'Bienvenue !',
    subtitle: 'Votre compte a été créé avec succès',
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${user.firstName},</h2>
        <p class="email-text">
          Nous sommes ravis de vous accueillir sur ${EMAIL_CONFIG.company.name} ! 
          Votre compte a été créé avec succès et vous pouvez dès maintenant profiter de toutes nos fonctionnalités.
        </p>
        
        <div class="alert alert-success">
          <strong>Votre compte est maintenant actif !</strong>
        </div>
      </div>
      
      <div class="email-section">
        <h3 class="email-section-title">Que pouvez-vous faire ?</h3>
        <div style="display: grid; gap: 15px; margin: 20px 0;">
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;">1</span>
            <span>Parcourir notre catalogue de produits</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;">2</span>
            <span>Passer des commandes en toute sécurité</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;">3</span>
            <span>Suivre vos livraisons en temps réel</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;">4</span>
            <span>Noter et commenter vos achats</span>
          </div>
        </div>
      </div>
      
      <div class="email-section text-center">
        <a href="${EMAIL_CONFIG.urls.frontend}/products" class="email-button">
          Découvrir nos produits
        </a>
        <div style="margin-top: 15px;">
          <a href="${EMAIL_CONFIG.urls.frontend}/profile" class="email-button email-button-secondary">
            Compléter mon profil
          </a>
        </div>
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Besoin d'aide ?</h3>
        <p class="email-text">
          Notre équipe de support est là pour vous aider. N'hésitez pas à nous contacter si vous avez des questions.
        </p>
        <p class="email-text mb-0">
          <strong>Email :</strong> ${EMAIL_CONFIG.company.email}<br>
          <strong>Téléphone :</strong> ${EMAIL_CONFIG.company.phone}
        </p>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Confirmation de commande
 */
export const generateOrderConfirmationEmail = (order, user) => {
  const orderItemsHTML = order.items.map(item => `
    <div class="order-item">
      <div style="display: flex; align-items: center;">
        <img src="${item.productImage || `${EMAIL_CONFIG.urls.frontend}/images/placeholder.jpg`}" 
             alt="${item.productName}" 
             class="order-item-image">
        <div class="order-item-details">
          <div class="order-item-name">${item.productName}</div>
          <div class="order-item-price">
            ${item.quantity} × ${item.unitPrice.toFixed(2)} €
            ${item.options ? `<br><small>${Object.entries(item.options).map(([key, value]) => `${key}: ${value}`).join(', ')}</small>` : ''}
          </div>
        </div>
      </div>
      <div style="font-weight: 600;">${(item.unitPrice * item.quantity).toFixed(2)} €</div>
    </div>
  `).join('');

  const data = {
    subject: `Confirmation de commande #${order.orderNumber}`,
    title: 'Commande confirmée !',
    subtitle: `Votre commande #${order.orderNumber} a été confirmée`,
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${user.firstName},</h2>
        <p class="email-text">
          Merci pour votre commande ! Nous avons bien reçu votre paiement et nous préparons votre colis.
        </p>
        
        <div class="alert alert-success">
          <strong>Commande confirmée</strong><br>
          Votre commande sera expédiée dans les plus brefs délais.
        </div>
      </div>
      
      <div class="email-section">
        <h3 class="email-section-title">Résumé de la commande</h3>
        <div class="order-summary">
          ${orderItemsHTML}
          <div class="order-total">
            Total : ${order.totalAmount.toFixed(2)} €
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
        <div>
          <h4 style="margin-bottom: 10px; color: ${EMAIL_CONFIG.colors.dark};">Adresse de livraison</h4>
          <p style="font-size: 14px; line-height: 1.5;">
            ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
            ${order.shippingAddress.country}<br>
            ${order.shippingAddress.phone ? `📞 ${order.shippingAddress.phone}` : ''}
          </p>
        </div>
        <div>
          <h4 style="margin-bottom: 10px; color: ${EMAIL_CONFIG.colors.dark};">Informations de livraison</h4>
          <p style="font-size: 14px; line-height: 1.5;">
            <strong>Méthode :</strong> ${order.shippingMethod}<br>
            <strong>Statut :</strong> En préparation<br>
            <strong>Estimation :</strong> 2-5 jours ouvrés
          </p>
        </div>
      </div>
      
      <div class="email-section text-center">
        <a href="${EMAIL_CONFIG.urls.frontend}/orders/${order.id}" class="email-button">
          Suivre ma commande
        </a>
        <div style="margin-top: 15px;">
          <a href="${EMAIL_CONFIG.urls.frontend}/orders" class="email-button email-button-secondary">
            Voir mes commandes
          </a>
        </div>
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Questions sur votre commande ?</h3>
        <p class="email-text">
          Si vous avez des questions concernant votre commande, n'hésitez pas à répondre à cet email ou à contacter notre service client.
        </p>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Commande expédiée
 */
export const generateOrderShippedEmail = (order, user, trackingInfo) => {
  const data = {
    subject: `Votre commande #${order.orderNumber} a été expédiée !`,
    title: 'Colis expédié !',
    subtitle: `Votre commande #${order.orderNumber} est en route`,
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${user.firstName},</h2>
        <p class="email-text">
          Excellente nouvelle ! Votre commande a été expédiée et est en route vers vous.
        </p>
        
        <div class="alert alert-info">
          <strong>Colis expédié</strong><br>
          Votre commande a été confiée à notre transporteur.
        </div>
      </div>
      
      <div class="email-section">
        <h3 class="email-section-title">Informations de suivi</h3>
        <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <strong>Numéro de suivi :</strong><br>
              <span style="font-family: monospace; font-size: 16px;">${trackingInfo.trackingNumber}</span>
            </div>
            <div>
              <strong>Transporteur :</strong><br>
              ${trackingInfo.carrier}
            </div>
          </div>
          ${trackingInfo.estimatedDelivery ? `
          <div style="margin-top: 15px;">
            <strong>Livraison estimée :</strong><br>
            ${new Date(trackingInfo.estimatedDelivery).toLocaleDateString('fr-FR')}
          </div>
          ` : ''}
        </div>
      </div>
      
      <div class="email-section text-center">
        ${trackingInfo.trackingUrl ? `
          <a href="${trackingInfo.trackingUrl}" class="email-button" target="_blank">
            Suivre mon colis
          </a>
        ` : `
          <a href="${EMAIL_CONFIG.urls.frontend}/orders/${order.id}/tracking" class="email-button">
            Suivre ma commande
          </a>
        `}
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Prochaines étapes</h3>
        <div style="display: grid; gap: 10px; margin: 15px 0;">
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.success}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px;">✓</span>
            <span>Commande confirmée</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.success}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 12px;">✓</span>
            <span>Colis expédié</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: ${EMAIL_CONFIG.colors.primary}; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;">3</span>
            <span>En transit</span>
          </div>
          <div style="display: flex; align-items: center;">
            <span style="background: #e5e7eb; color: ${EMAIL_CONFIG.colors.text}; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 14px;">4</span>
            <span>Livré</span>
          </div>
        </div>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Réinitialisation de mot de passe
 */
export const generatePasswordResetEmail = (user, resetToken) => {
  const resetUrl = `${EMAIL_CONFIG.urls.frontend}/auth/reset-password?token=${resetToken}`;

  const data = {
    subject: 'Réinitialisation de votre mot de passe',
    title: 'Mot de passe oublié ?',
    subtitle: 'Réinitialisez votre mot de passe en toute sécurité',
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${user.firstName},</h2>
        <p class="email-text">
          Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
        </p>
        
        <div class="alert alert-warning">
          <strong>Important :</strong> Ce lien expirera dans 1 heure pour des raisons de sécurité.
        </div>
      </div>
      
      <div class="email-section text-center">
        <a href="${resetUrl}" class="email-button">
          Réinitialiser mon mot de passe
        </a>
      </div>
      
      <div class="email-section">
        <p class="email-text">
          Si le bouton ne fonctionne pas, vous pouvez copier-coller le lien suivant dans votre navigateur :
        </p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 14px;">
          ${resetUrl}
        </div>
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Vous n'êtes pas à l'origine de cette demande ?</h3>
        <p class="email-text">
          Si vous n'avez pas demandé de réinitialisation de mot de passe, veuillez ignorer cet email. 
          Votre mot de passe restera inchangé.
        </p>
        <p class="email-text">
          Pour des raisons de sécurité, nous vous recommandons de :
        </p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Vérifier l'activité récente de votre compte</li>
          <li>Changer votre mot de passe si vous suspectez une activité suspecte</li>
          <li>Nous contacter si vous avez des questions</li>
        </ul>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Vérification d'email
 */
export const generateEmailVerificationEmail = (user, verificationToken) => {
  const verificationUrl = `${EMAIL_CONFIG.urls.frontend}/auth/verify-email?token=${verificationToken}`;

  const data = {
    subject: 'Vérifiez votre adresse email',
    title: 'Vérifiez votre email',
    subtitle: 'Confirmez votre adresse email pour activer votre compte',
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${user.firstName},</h2>
        <p class="email-text">
          Merci de vous être inscrit sur ${EMAIL_CONFIG.company.name} ! 
          Pour finaliser votre inscription, veuillez vérifier votre adresse email.
        </p>
      </div>
      
      <div class="email-section text-center">
        <a href="${verificationUrl}" class="email-button">
          Vérifier mon email
        </a>
      </div>
      
      <div class="email-section">
        <p class="email-text">
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
        </p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; word-break: break-all; font-size: 14px;">
          ${verificationUrl}
        </div>
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Pourquoi vérifier mon email ?</h3>
        <p class="email-text">
          La vérification de votre email nous permet de :
        </p>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li>Assurer la sécurité de votre compte</li>
          <li>Vous envoyer des notifications importantes</li>
          <li>Vous permettre de réinitialiser votre mot de passe si besoin</li>
          <li>Activer toutes les fonctionnalités de votre compte</li>
        </ul>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Notification de nouveau message
 */
export const generateNewMessageEmail = (user, message, conversation) => {
  const conversationUrl = `${EMAIL_CONFIG.urls.frontend}/messages/${conversation.id}`;

  const data = {
    subject: `Nouveau message de ${message.senderName}`,
    title: 'Nouveau message',
    subtitle: `Vous avez reçu un nouveau message de ${message.senderName}`,
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${user.firstName},</h2>
        <p class="email-text">
          Vous avez reçu un nouveau message dans votre conversation avec <strong>${message.senderName}</strong>.
        </p>
      </div>
      
      <div class="email-section">
        <div style="background: #f8fafc; border-left: 4px solid ${EMAIL_CONFIG.colors.primary}; padding: 20px; border-radius: 0 8px 8px 0;">
          <div style="font-style: italic; margin-bottom: 10px;">"${message.content}"</div>
          <div style="font-size: 14px; color: ${EMAIL_CONFIG.colors.muted};">
            — ${message.senderName}
          </div>
        </div>
      </div>
      
      <div class="email-section text-center">
        <a href="${conversationUrl}" class="email-button">
          Voir la conversation
        </a>
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Gérer vos notifications</h3>
        <p class="email-text">
          Vous pouvez modifier vos préférences de notification dans les paramètres de votre compte.
        </p>
        <a href="${EMAIL_CONFIG.urls.frontend}/profile/notifications" class="email-button email-button-secondary">
          Paramètres de notification
        </a>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Newsletter
 */
export const generateNewsletterEmail = (user, newsletter) => {
  const data = {
    subject: newsletter.subject,
    title: newsletter.title,
    subtitle: newsletter.subtitle,
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        ${newsletter.image ? `
          <img src="${newsletter.image}" alt="${newsletter.title}" style="width: 100%; height: auto; border-radius: 8px; margin-bottom: 20px;">
        ` : ''}
        
        <div style="font-size: 16px; line-height: 1.7;">
          ${newsletter.content}
        </div>
      </div>
      
      ${newsletter.cta ? `
        <div class="email-section text-center">
          <a href="${newsletter.cta.url}" class="email-button">
            ${newsletter.cta.text}
          </a>
        </div>
      ` : ''}
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Ne plus recevoir cette newsletter ?</h3>
        <p class="email-text">
          Si vous ne souhaitez plus recevoir nos newsletters, vous pouvez vous désabonner à tout moment.
        </p>
        <a href="${EMAIL_CONFIG.urls.frontend}/profile/notifications" class="email-button email-button-secondary">
          Gérer mes abonnements
        </a>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

/**
 * TEMPLATE: Notification de vendeur (nouvelle commande)
 */
export const generateNewOrderNotificationEmail = (seller, order) => {
  const orderUrl = `${EMAIL_CONFIG.urls.frontend}/dashboard/seller/orders/${order.id}`;

  const data = {
    subject: `Nouvelle commande #${order.orderNumber}`,
    title: 'Nouvelle commande !',
    subtitle: `Vous avez reçu une nouvelle commande de ${order.customerName}`,
    logo: EMAIL_CONFIG.company.logo,
    content: `
      <div class="email-section">
        <h2 class="email-section-title">Bonjour ${seller.firstName},</h2>
        <p class="email-text">
          Félicitations ! Vous avez reçu une nouvelle commande sur ${EMAIL_CONFIG.company.name}.
        </p>
        
        <div class="alert alert-success">
          <strong>Nouvelle commande #${order.orderNumber}</strong><br>
          Montant : ${order.totalAmount.toFixed(2)} €
        </div>
      </div>
      
      <div class="email-section">
        <h3 class="email-section-title">Détails de la commande</h3>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
          <div style="display: grid; gap: 10px;">
            <div><strong>Client :</strong> ${order.customerName}</div>
            <div><strong>Email :</strong> ${order.customerEmail}</div>
            <div><strong>Date :</strong> ${new Date(order.createdAt).toLocaleDateString('fr-FR')}</div>
            <div><strong>Total :</strong> ${order.totalAmount.toFixed(2)} €</div>
          </div>
        </div>
      </div>
      
      <div class="email-section text-center">
        <a href="${orderUrl}" class="email-button">
          Voir la commande
        </a>
      </div>
      
      <div class="email-divider"></div>
      
      <div class="email-section">
        <h3 class="email-section-title">Prochaines étapes</h3>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li>Préparez les articles commandés</li>
          <li>Mettez à jour le statut de la commande</li>
          <li>Expédiez la commande dans les délais</li>
          <li>Ajoutez le numéro de suivi</li>
        </ol>
        <p class="email-text">
          N'oubliez pas de mettre à jour le statut de la commande dans votre tableau de bord vendeur.
        </p>
      </div>
    `,
  };

  return {
    subject: data.subject,
    html: renderTemplate(BASE_TEMPLATE, data),
  };
};

// Export de tous les templates
export const EMAIL_TEMPLATES = {
  WELCOME: generateWelcomeEmail,
  ORDER_CONFIRMATION: generateOrderConfirmationEmail,
  ORDER_SHIPPED: generateOrderShippedEmail,
  PASSWORD_RESET: generatePasswordResetEmail,
  EMAIL_VERIFICATION: generateEmailVerificationEmail,
  NEW_MESSAGE: generateNewMessageEmail,
  NEWSLETTER: generateNewsletterEmail,
  SELLER_NEW_ORDER: generateNewOrderNotificationEmail,
};

// Helper pour générer un email
export const generateEmail = (templateName, data) => {
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) {
    throw new Error(`Template email inconnu: ${templateName}`);
  }
  return template(data);
};

export default EMAIL_TEMPLATES;
