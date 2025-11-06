/**
 * Service d'envoi d'emails avec Resend
 */

import { Resend } from 'resend';

// Initialiser Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Templates d'emails
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  ORDER_CONFIRMATION: 'order_confirmation',
  PASSWORD_RESET: 'password_reset',
  ORDER_SHIPPED: 'order_shipped',
  NEWSLETTER: 'newsletter',
  CONTACT: 'contact',
};

// Configurations par défaut
const DEFAULT_CONFIG = {
  from: 'BuySell Platform <noreply@buysell.com>',
  replyTo: 'support@buysell.com',
};

/**
 * Envoyer un email de bienvenue
 */
export const sendWelcomeEmail = async (user) => {
  try {
    const { data, error } = await resend.emails.send({
      ...DEFAULT_CONFIG,
      to: user.email,
      subject: 'Bienvenue sur BuySell Platform ! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Bienvenue sur BuySell Platform !</h1>
            </div>
            <div class="content">
              <h2>Bonjour ${user.firstName},</h2>
              <p>Nous sommes ravis de vous accueillir sur notre marketplace.</p>
              <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
              <ul>
                <li>Parcourir notre catalogue de produits</li>
                <li>Passer des commandes en toute sécurité</li>
                <li>Suivre vos livraisons en temps réel</li>
                <li>Noter vos achats</li>
              </ul>
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_FRONTEND_URL}/products" class="button">
                  Découvrir nos produits
                </a>
              </div>
              <p>Si vous avez des questions, n'hésitez pas à répondre à cet email.</p>
              <p>À bientôt sur BuySell Platform !</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 BuySell Platform. Tous droits réservés.</p>
              <p>${process.env.NEXT_PUBLIC_FRONTEND_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de confirmation de commande
 */
export const sendOrderConfirmationEmail = async (order, user) => {
  try {
    const { data, error } = await resend.emails.send({
      ...DEFAULT_CONFIG,
      to: user.email,
      subject: `Confirmation de commande #${order.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .order-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .product { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; border-bottom: 1px solid #eee; }
            .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Confirmation de commande</h1>
              <p>Merci pour votre achat !</p>
            </div>
            <div class="content">
              <h2>Bonjour ${user.firstName},</h2>
              <p>Votre commande <strong>#${order.orderNumber}</strong> a été confirmée.</p>
              
              <div class="order-details">
                <h3>Détails de la commande</h3>
                ${order.items.map(item => `
                  <div class="product">
                    <span>${item.quantity} × ${item.productName}</span>
                    <span>${(item.unitPrice * item.quantity).toFixed(2)} €</span>
                  </div>
                `).join('')}
                <div class="total">
                  Total: ${order.totalAmount.toFixed(2)} €
                </div>
              </div>

              <p><strong>Adresse de livraison :</strong></p>
              <p>
                ${order.shippingAddress.firstName} ${order.shippingAddress.lastName}<br>
                ${order.shippingAddress.street}<br>
                ${order.shippingAddress.postalCode} ${order.shippingAddress.city}<br>
                ${order.shippingAddress.country}
              </p>

              <p>Vous recevrez un email de suivi lorsque votre commande sera expédiée.</p>
              <p>Merci d'avoir choisi BuySell Platform !</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 BuySell Platform. Tous droits réservés.</p>
              <p>${process.env.NEXT_PUBLIC_FRONTEND_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de réinitialisation de mot de passe
 */
export const sendPasswordResetEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      ...DEFAULT_CONFIG,
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 24px; background: #ff6b6b; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Réinitialisation de mot de passe</h1>
            </div>
            <div class="content">
              <h2>Bonjour,</h2>
              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              <p>Ce lien expirera dans 1 heure pour des raisons de sécurité.</p>
              <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 BuySell Platform. Tous droits réservés.</p>
              <p>${process.env.NEXT_PUBLIC_FRONTEND_URL}</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
};

/**
 * Envoyer un email de contact
 */
export const sendContactEmail = async (contactData) => {
  try {
    const { data, error } = await resend.emails.send({
      ...DEFAULT_CONFIG,
      to: 'contact@buysell.com',
      subject: `Nouveau message de contact: ${contactData.subject}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #667eea; color: white; padding: 20px; text-align: center; }
            .content { background: #f9f9f9; padding: 20px; }
            .field { margin: 10px 0; }
            .label { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nouveau message de contact</h1>
            </div>
            <div class="content">
              <div class="field">
                <span class="label">De:</span> ${contactData.name} (${contactData.email})
              </div>
              <div class="field">
                <span class="label">Sujet:</span> ${contactData.subject}
              </div>
              <div class="field">
                <span class="label">Message:</span>
                <p>${contactData.message}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to send contact email:', error);
    throw error;
  }
};

export default resend;
