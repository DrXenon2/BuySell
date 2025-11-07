/**
 * Templates d'emails
 */

const emailTemplates = {
  WELCOME: {
    subject: 'Bienvenue sur BuySell Africa ! 🎉',
    generate: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Bienvenue sur BuySell Africa !</h1>
            <p>Votre marketplace africaine préférée</p>
          </div>
          <div class="content">
            <h2>Bonjour ${data.user.firstName},</h2>
            <p>Nous sommes ravis de vous accueillir sur BuySell, la plateforme de commerce en ligne qui révolutionne les achats et ventes en Afrique.</p>
            
            <h3>🎯 Ce que vous pouvez faire :</h3>
            <ul>
              <li>🛍️ Acheter des produits neufs et d'occasion</li>
              <li>💰 Vendre vos articles en toute sécurité</li>
              <li>📱 Payer avec vos moyens de paiement locaux</li>
              <li>⭐ Noter et évaluer les vendeurs</li>
              <li>🚚 Livraison dans toute l'Afrique</li>
            </ul>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}" class="button">Commencer à magasiner</a>
            </div>

            <p>Besoin d'aide ? Notre équipe de support est là pour vous accompagner.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Africa. Tous droits réservés.</p>
            <p>Cet email a été envoyé à ${data.user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  VERIFICATION: {
    subject: 'Vérifiez votre adresse email',
    generate: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #4facfe; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .code { background: #f0f0f0; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Vérification d'email</h1>
            <p>BuySell Africa - Sécurité de votre compte</p>
          </div>
          <div class="content">
            <h2>Bonjour ${data.user.firstName},</h2>
            <p>Pour finaliser la création de votre compte et assurer la sécurité de vos données, veuillez vérifier votre adresse email.</p>
            
            <p>Cliquez sur le bouton ci-dessous pour vérifier votre email :</p>

            <div style="text-align: center;">
              <a href="${data.verificationUrl}" class="button">Vérifier mon email</a>
            </div>

            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <div class="code">${data.verificationUrl}</div>

            <p><strong>Important :</strong> Ce lien expirera dans 24 heures pour des raisons de sécurité.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Africa. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  PASSWORD_RESET: {
    subject: 'Réinitialisation de votre mot de passe',
    generate: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { background: #ff6b6b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Réinitialisation de mot de passe</h1>
            <p>BuySell Africa - Sécurité du compte</p>
          </div>
          <div class="content">
            <h2>Bonjour ${data.user.firstName},</h2>
            <p>Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte BuySell.</p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong> Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.
            </div>

            <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>

            <div style="text-align: center;">
              <a href="${data.resetUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>

            <p>Ce lien de réinitialisation expirera dans 1 heure pour des raisons de sécurité.</p>

            <p>Après réinitialisation, vous pourrez vous connecter avec votre nouveau mot de passe.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Africa. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  ORDER_CONFIRMATION: {
    subject: 'Confirmation de votre commande #{{order.id}}',
    generate: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10ac84 0%, #1dd1a1 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd; }
          .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .order-total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 10px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Commande Confirmée !</h1>
            <p>Votre achat sur BuySell Africa</p>
          </div>
          <div class="content">
            <h2>Merci pour votre achat, ${data.user.firstName} !</h2>
            <p>Votre commande <strong>#${data.order.id}</strong> a été confirmée et est en cours de traitement.</p>
            
            <div class="order-summary">
              <h3>Résumé de la commande :</h3>
              ${data.order.items.map(item => `
                <div class="order-item">
                  <span>${item.name || 'Produit'} x ${item.quantity}</span>
                  <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.price * item.quantity)}</span>
                </div>
              `).join('')}
              <div class="order-total">
                Total: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.order.total)}
              </div>
            </div>

            <p>Nous vous enverrons une mise à jour dès que votre commande sera expédiée.</p>
            <p>Vous pouvez suivre l'état de votre commande depuis votre espace client.</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 BuySell Africa. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `
  },

  SELLER_ORDER_NOTIFICATION: {
    subject: 'Nouvelle commande reçue - #{{order.id}}',
    generate: (data) => `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .order-summary { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border: 1px solid #ddd; }
          .order-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .order-total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 10px; }
          .button { background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Nouvelle Commande !</h1>
            <p>Félicitations pour cette vente</p>
          </div>
          <div class="content">
            <h2>Bonnes nouvelles, ${data.seller.firstName} !</h2>
            <p>Vous avez reçu une nouvelle commande <strong>#${data.order.id}</strong> sur votre boutique BuySell.</p>
            
            <div class="order-summary">
              <h3>Détails de la commande :</h3>
              ${data.order.items.map(item => `
                <div class="order-item">
                  <span>${item.name || 'Produit'} x ${item.quantity}</span>
                  <span>${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(item.price * item.quantity)}</span>
                </div>
              `).join('')}
              <div class="order-total">
                Montant total: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(data.order.total)}
              </div>
            </div>

            <p>Veuillez préparer la commande et mettre à jour son statut dans votre espace vendeur.</p>

            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/seller/orders/${data.order.id}" class="button">Voir la commande</a>
            </div>

            <p><strong>Rappel :</strong> Le paiement vous sera reversé après confirmation de livraison par l'acheteur.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 BuySell Africa. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
};

// Fonction pour générer un email
function generateEmail(templateName, data) {
  const template = emailTemplates[templateName];
  if (!template) {
    throw new Error(`Template d'email non trouvé: ${templateName}`);
  }

  let html = template.generate(data);
  
  // Remplacer les variables dynamiques dans le sujet
  let subject = template.subject;
  subject = subject.replace('{{order.id}}', data.order?.id || '');

  return {
    subject,
    html
  };
}

module.exports = { generateEmail, emailTemplates };
