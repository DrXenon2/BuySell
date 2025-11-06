/**
 * Configuration Supabase
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  options: {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      storageKey: 'supabase.auth.token',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      headers: {
        'x-application-name': 'buy-sell-platform',
      },
    },
  },
};

// Initialisation du client Supabase
export const supabase = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  SUPABASE_CONFIG.options
);

// Tables Supabase
export const TABLES = {
  profiles: 'profiles',
  products: 'products',
  categories: 'categories',
  orders: 'orders',
  order_items: 'order_items',
  reviews: 'reviews',
  addresses: 'addresses',
  wishlists: 'wishlists',
  coupons: 'coupons',
  notifications: 'notifications',
};

// Buckets de stockage
export const STORAGE_BUCKETS = {
  products: 'product-images',
  avatars: 'user-avatars',
  documents: 'documents',
  general: 'uploads',
};

// RLS Policies (pour référence)
export const RLS_POLICIES = {
  // Profiles
  profiles: {
    select: 'Users can view their own profile',
    update: 'Users can update their own profile',
    insert: 'Users can create their own profile',
  },
  
  // Products
  products: {
    select: 'Anyone can view active products',
    insert: 'Sellers can create products',
    update: 'Sellers can update their own products',
    delete: 'Sellers can delete their own products',
  },
  
  // Orders
  orders: {
    select: 'Users can view their own orders',
    insert: 'Users can create orders',
    update: 'Users can update their own orders',
  },
};

// Événements realtime à écouter
export const REALTIME_EVENTS = {
  orders: {
    inserted: 'INSERT',
    updated: 'UPDATE',
    deleted: 'DELETE',
  },
  products: {
    updated: 'UPDATE',
  },
};

export default supabase;
