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
              <strong>⚠️ Important :</strong> Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email
