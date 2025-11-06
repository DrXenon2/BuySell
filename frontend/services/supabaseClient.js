import { createClient } from '@supabase/supabase-js';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes dans l\'environnement');
}

// Création du client Supabase
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
  global: {
    headers: {
      'X-Client-Info': 'buy-sell-platform@1.0.0',
    },
  },
});

// Événements d'authentification
supabaseClient.auth.onAuthStateChange((event, session) => {
  console.log('Supabase Auth Event:', event, session);
  
  if (event === 'SIGNED_IN') {
    // Synchroniser avec le state de l'application
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('authStateChange', { 
        detail: { event, session } 
      }));
    }
  }
  
  if (event === 'SIGNED_OUT') {
    // Nettoyer le state local
    localStorage.removeItem('supabase.auth.token');
  }
});

// Méthodes utilitaires Supabase
export const supabaseHelpers = {
  // Récupérer l'utilisateur actuel
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Récupérer la session
  getSession: async () => {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: async () => {
    const session = await supabaseHelpers.getSession();
    return !!session;
  },

  // Souscrire aux changements en temps réel
  subscribeToChanges: (table, event, callback) => {
    return supabaseClient
      .channel('table-changes')
      .on(
        'postgres_changes',
        {
          event,
          schema: 'public',
          table,
        },
        callback
      )
      .subscribe();
  }
};

export default supabaseClient;
