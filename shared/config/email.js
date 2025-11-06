// Email configuration and templates

const config = require('./app');

// Email templates configuration
const emailTemplates = {
  // Welcome email
  WELCOME: {
    subject: 'Welcome to {{appName}}!',
    template: 'welcome',
    variables: ['appName', 'userName', 'verifyUrl'],
  },
  
  // Email verification
  VERIFY_EMAIL: {
    subject: 'Verify your email address',
    template: 'verify-email',
    variables: ['appName', 'userName', 'verifyUrl', 'expiresIn'],
  },
  
  // Password reset
  PASSWORD_RESET: {
    subject: 'Reset your password',
    template: 'password-reset',
    variables: ['appName', 'userName', 'resetUrl', 'expiresIn'],
  },
  
  // Order confirmation
  ORDER_CONFIRMATION: {
    subject: 'Order Confirmation - {{orderNumber}}',
    template: 'order-confirmation',
    variables: ['appName', 'userName', 'orderNumber', 'orderDate', 'orderTotal', 'orderItems', 'shippingAddress'],
  },
  
  // Order shipped
  ORDER_SHIPPED: {
    subject: 'Your order has been shipped!',
    template: 'order-shipped',
    variables: ['appName', 'userName', 'orderNumber', 'trackingNumber', 'trackingUrl', 'estimatedDelivery'],
  },
  
  // Payment receipt
  PAYMENT_RECEIPT: {
    subject: 'Payment Receipt - {{orderNumber}}',
    template: 'payment-receipt',
    variables: ['appName', 'userName', 'orderNumber', 'paymentDate', 'paymentAmount', 'paymentMethod'],
  },
  
  // Account security alert
  SECURITY_ALERT: {
    subject: 'Security Alert - New Login Detected',
    template: 'security-alert',
    variables: ['appName', 'userName', 'loginTime', 'loginLocation', 'deviceInfo'],
  },
};

// Email template content (HTML and text versions)
const templateContent = {
  'welcome': {
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to {{appName}}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to {{appName}}!</h1>
          </div>
          <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>Thank you for joining {{appName}}! We're excited to have you on board.</p>
            <p>Get started by verifying your email address:</p>
            <p style="text-align: center;">
              <a href="{{verifyUrl}}" class="button">Verify Email Address</a>
            </p>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to {{appName}}!
      
      Hello {{userName}},
      
      Thank you for joining {{appName}}! We're excited to have you on board.
      
      Get started by verifying your email address:
      {{verifyUrl}}
      
      If you have any questions, feel free to contact our support team.
      
      © {{year}} {{appName}}. All rights reserved.
    `,
  },
  
  'verify-email': {
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Verify Your Email</h1>
          </div>
          <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>Please verify your email address by clicking the button below:</p>
            <p style="text-align: center;">
              <a href="{{verifyUrl}}" class="button">Verify Email Address</a>
            </p>
            <div class="warning">
              <p><strong>This link will expire in {{expiresIn}}.</strong></p>
              <p>If you didn't create an account with {{appName}}, you can safely ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Verify Your Email
      
      Hello {{userName}},
      
      Please verify your email address by clicking the link below:
      {{verifyUrl}}
      
      This link will expire in {{expiresIn}}.
      
      If you didn't create an account with {{appName}}, you can safely ignore this email.
      
      © {{year}} {{appName}}. All rights reserved.
    `,
  },
  
  'password-reset': {
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .button { background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 12px; margin: 16px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <h2>Hello {{userName}},</h2>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <p style="text-align: center;">
              <a href="{{resetUrl}}" class="button">Reset Password</a>
            </p>
            <div class="warning">
              <p><strong>This link will expire in {{expiresIn}}.</strong></p>
              <p>If you didn't request a password reset, please ignore this email.</p>
            </div>
          </div>
          <div class="footer">
            <p>&copy; {{year}} {{appName}}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Reset Your Password
      
      Hello {{userName}},
      
      We received a request to reset your password. Click the link below to create a new password:
      {{resetUrl}}
      
      This link will expire in {{expiresIn}}.
      
      If you didn't request a password reset, please ignore this email.
      
      © {{year}} {{appName}}. All rights reserved.
    `,
  },
};

// Email configuration
const emailConfig = {
  // Default sender
  from: {
    name: config.app.name,
    email: config.email.from,
  },
  
  // Template configuration
  templates: emailTemplates,
  
  // Template content
  content: templateContent,
  
  // Common variables that are available in all templates
  commonVariables: {
    appName: config.app.name,
    appUrl: config.app.url,
    supportEmail: 'support@buysellplatform.com',
    year: new Date().getFullYear(),
  },
};

module.exports = emailConfig;
