/**
 * Templates d'emails avec génération dynamique
 */

const emailTemplates = {
  // ==================== TEMPLATES DE BASE ====================
  
  WELCOME: {
    subject: 'Bienvenue sur BuySell Africa ! 🎉',
    generate: (data) => {
      const { user, verificationUrl } = data;
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bienvenue sur BuySell</title>
          <style>
            /* Styles optimisés pour l'email */
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6; 
              color: #333; 
              margin: 0; 
              padding: 0; 
              background-color: #f9f9f9;
            }
            .container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: white;
            }
            .header { 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center; 
            }
            .content { 
              padding: 40px 30px; 
            }
            .button { 
              background: #667eea; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              display: inline-block; 
              margin: 20px 0; 
              font-weight: bold;
              font-size: 16px;
            }
            .features { 
              background: #f8f9fa; 
              padding: 25px; 
              border-radius: 8px; 
              margin: 25px 0; 
            }
            .feature-item { 
              display: flex; 
              align-items: center; 
              margin-bottom: 12px; 
            }
            .feature-icon { 
              margin-right: 12px; 
              font-size: 18px; 
            }
            .footer { 
              text-align: center; 
              margin-top: 40px; 
              color: #666; 
              font-size: 14px; 
              padding: 20px;
              border-top: 1px solid #eee;
            }
            @media only screen and (max-width: 600px) {
              .container { width: 100% !important; }
              .content { padding: 20px !important; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 28px;">Bienvenue sur BuySell Africa !</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">
                Votre marketplace africaine préférée
              </p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Bonjour ${user.firstName},</h2>
              
              <p style="font-size: 16px; line-height: 1.6;">
                Nous sommes ravis de vous accueillir sur <strong>BuySell Africa</strong>, 
                la plateforme de commerce en ligne qui révolutionne les achats et ventes en Afrique.
              </p>

              <div class="features">
                <h3 style="color: #333; margin-top: 0;">🎯 Découvrez nos fonctionnalités :</h3>
                
                <div class="feature-item">
                  <span class="feature-icon">🛍️</span>
                  <span>Achetez des produits neufs et d'occasion</span>
                </div>
                
                <div class="feature-item">
                  <span class="feature-icon">💰</span>
                  <span>Vendez vos articles en toute sécurité</span>
                </div>
                
                <div class="feature-item">
                  <span class="feature-icon">📱</span>
                  <span>Payez avec vos moyens de paiement locaux</span>
                </div>
                
                <div class="feature-item">
                  <span class="feature-icon">⭐</span>
                  <span>Notez et évaluez les vendeurs</span>
                </div>
                
                <div class="feature-item">
                  <span class="feature-icon">🚚</span>
                  <span>Livraison dans toute l'Afrique</span>
                </div>
              </div>

              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}" class="button">
                  Commencer à magasiner
                </a>
              </div>

              ${verificationUrl ? `
                <p style="font-size: 14px; color: #666; text-align: center;">
                  <strong>Important :</strong> 
                  <a href="${verificationUrl}" style="color: #667eea;">
                    Vérifiez votre adresse email
                  </a> pour activer toutes les fonctionnalités.
                </p>
              ` : ''}

              <p style="font-size: 16px; line-height: 1.6;">
                Besoin d'aide ? Notre équipe de support est là pour vous accompagner à chaque étape.
                N'hésitez pas à nous contacter si vous avez des questions.
              </p>
            </div>
            
            <div class="footer">
              <p style="margin: 0 0 10px 0;">
                &copy; 2024 BuySell Africa. Tous droits réservés.
              </p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                Cet email a été envoyé à ${user.email} • 
                <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #999;">
                  Se désabonner
                </a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
  },

  // ==================== TEMPLATES MÉTIER ====================
  
  ORDER_CONFIRMATION: {
    subject: 'Confirmation de votre commande #{{order.id}}',
    generate: (data) => {
      const { user, order } = data;
      const totalFormatted = new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: order.currency || 'XOF'
      }).format(order.total);
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de commande</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 30px; }
            .order-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #dee2e6; }
            .order-total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 10px; padding-top: 10px; border-top: 2px solid #dee2e6; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; padding: 20px; border-top: 1px solid #dee2e6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Commande Confirmée !</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Votre achat sur BuySell Africa</p>
            </div>
            
            <div class="content">
              <h2 style="color: #333; margin-top: 0;">Merci pour votre achat, ${user.firstName} !</h2>
              
              <p>Votre commande <strong>#${order.id}</strong> a été confirmée et est en cours de traitement.</p>
              
              <div class="order-summary">
                <h3 style="margin-top: 0; color: #333;">Résumé de la commande :</h3>
                
                ${order.items.map(item => {
                  const itemTotal = item.price * item.quantity;
                  const itemTotalFormatted = new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: order.currency || 'XOF'
                  }).format(itemTotal);
                  
                  return `
                    <div class="order-item">
                      <div>
                        <strong>${item.name || 'Produit'}</strong>
                        <br>
                        <small>Quantité: ${item.quantity} × ${new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: order.currency || 'XOF'
                        }).format(item.price)}</small>
                      </div>
                      <div>${itemTotalFormatted}</div>
                    </div>
                  `;
                }).join('')}
                
                <div class="order-total">
                  Total: ${totalFormatted}
                </div>
              </div>
              
              <p>Nous vous enverrons une mise à jour dès que votre commande sera expédiée.</p>
              <p>Vous pouvez suivre l'état de votre commande depuis votre espace client.</p>
            </div>
            
            <div class="footer">
              <p style="margin: 0;">&copy; 2024 BuySell Africa. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }
  },

  // Ajouter d'autres templates ici...
  PASSWORD_RESET: {
    subject: 'Réinitialisation de votre mot de passe',
    generate: (data) => { /* Template de réinitialisation */ }
  },
  
  VERIFICATION: {
    subject: 'Vérifiez votre adresse email',
    generate: (data) => { /* Template de vérification */ }
  },
  
  SELLER_ORDER_NOTIFICATION: {
    subject: 'Nouvelle commande reçue - #{{order.id}}',
    generate: (data) => { /* Template notification vendeur */ }
  }
};

// ==================== FONCTION DE GÉNÉRATION ====================

/**
 * Génère un email basé sur le template
 */
function generateEmail(templateName, data) {
  const template = emailTemplates[templateName];
  
  if (!template) {
    throw new Error(`Template d'email non trouvé: ${templateName}`);
  }

  let html = template.generate(data);
  
  // Remplacer les variables dynamiques dans le sujet
  let subject = template.subject;
  const variables = subject.match(/{{(.*?)}}/g) || [];
  
  variables.forEach(variable => {
    const key = variable.replace(/{{|}}/g, '').trim();
    const value = getNestedValue(data, key) || '';
    subject = subject.replace(variable, value);
  });

  return {
    subject,
    html
  };
}

/**
 * Obtient une valeur imbriquée d'un objet
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : '';
  }, obj);
}

module.exports = { 
  generateEmail, 
  emailTemplates 
};
