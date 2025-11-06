/**
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required');
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Supabase service class
 */
class SupabaseService {
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    return user;
  }

  /**
   * Get user session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    return session;
  }

  /**
   * Sign up with email and password
   */
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in with OAuth provider
   */
  async signInWithProvider(provider, options = {}) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
  }

  /**
   * Reset password
   */
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update password
   */
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates) {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Upload file to storage
   */
  async uploadFile(bucket, path, file, options = {}) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options,
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get public URL for file
   */
  getPublicUrl(bucket, path) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket, path) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (error) throw error;
    return data;
  }

  /**
   * Subscribe to realtime changes
   */
  subscribe(channel, event, callback) {
    return supabase.channel(channel)
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
        },
        callback
      )
      .subscribe();
  }

  /**
   * Unsubscribe from channel
   */
  unsubscribe(channel) {
    return supabase.removeChannel(channel);
  }
}

// Create singleton instance
export const supabaseService = new SupabaseService();

export default supabaseService;
