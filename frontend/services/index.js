/**
 * Point d'entrée principal pour tous les services
 * Centralise les imports et exports des services
 */

// Services API
export { default as api } from './api';
export { default as supabaseClient } from './supabaseClient';

// Services d'authentification
export { default as authService } from './authService';
export { default as userService } from './userService';

// Services métier
export { default as productService } from './productService';
export { default as categoryService } from './categoryService';
export { default as cartService } from './cartService';
export { default as orderService } from './orderService';
export { default as paymentService } from './paymentService';
export { default as reviewService } from './reviewService';

// Services utilitaires
export { default as uploadService } from './uploadService';
export { default as analyticsService } from './analyticsService';
export { default as notificationService } from './notificationService';

// Services de configuration
export { default as configService } from './configService';
