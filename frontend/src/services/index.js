/**
 * Main exports file for services
 */

// API service
export * from './api';

// Supabase client
export * from './supabaseClient';

// Authentication service
export * from './authService';

// Product service
export * from './productService';

// Order service
export * from './orderService';

// Cart service
export * from './cartService';

// Payment service
export * from './paymentService';

// Review service
export * from './reviewService';

// User service
export * from './userService';

// Upload service
export * from './uploadService';

// Analytics service
export * from './analyticsService';

// Notification service
export * from './notificationService';

// Export service instances for convenience
export { default as apiService } from './api';
export { default as supabaseService } from './supabaseClient';
export { default as authService } from './authService';
export { default as productService } from './productService';
export { default as orderService } from './orderService';
export { default as cartService } from './cartService';
export { default as paymentService } from './paymentService';
export { default as reviewService } from './reviewService';
export { default as userService } from './userService';
export { default as uploadService } from './uploadService';
export { default as analyticsService } from './analyticsService';
export { default as notificationService } from './notificationService';
