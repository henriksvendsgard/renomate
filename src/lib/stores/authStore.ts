import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';
import type { User } from '$lib/types';
import type { AuthResponse, User as SupabaseUser } from '@supabase/supabase-js';
import { writable } from 'svelte/store';

// Define the auth store type
type AuthStore = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Create the initial state
const initialState: AuthStore = {
  user: null,
  isAuthenticated: false,
  loading: true
};

// Convert Supabase user to our app User type
const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'User',
    avatar: supabaseUser.user_metadata?.avatar_url || ''
  };
};

// Create the auth store
const createAuthStore = () => {
  // Create the writable store
  const { subscribe: baseSubscribe, set, update } = writable<AuthStore>(initialState);

  // Wrap the subscribe function to ensure it always returns a valid unsubscribe function
  const subscribe = (run: (value: AuthStore) => void) => {
    try {
      const unsubscribe = baseSubscribe(run);
      return () => {
        try {
          unsubscribe();
        } catch (error) {
          console.error('Error in unsubscribe:', error);
        }
      };
    } catch (error) {
      console.error('Error in subscribe:', error);
      // Return a no-op function if subscription fails
      return () => {};
    }
  };

  // Function to initialize the auth state
  const initialize = async () => {
    if (!browser) {
      // When not in browser, immediately set loading to false
      update(state => ({ ...state, loading: false }));
      return;
    }
    
    console.log('Auth store initializing...');
    
    try {
      // Get the current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Map the Supabase user to our app user
        const user = mapSupabaseUser(session.user);
        console.log('Auth store: Found user in session', user.id);
        
        update(state => ({
          ...state,
          user,
          isAuthenticated: true,
          loading: false
        }));
      } else {
        console.log('Auth store: No session found');
        update(state => ({ ...state, loading: false }));
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('Auth state change:', event);
          if (session?.user) {
            const user = mapSupabaseUser(session.user);
            update(state => ({
              ...state,
              user,
              isAuthenticated: true,
              loading: false
            }));
          } else {
            update(state => ({
              ...state,
              user: null,
              isAuthenticated: false,
              loading: false
            }));
          }
        }
      );

      // Return function to unsubscribe when store is destroyed
      return () => {
        subscription.unsubscribe();
      };
    } catch (e) {
      console.error('Auth store: Initialization error', e);
      update(state => ({ ...state, loading: false }));
    }
  };

  // Define the store methods
  return {
    subscribe,
    login: async (email: string, password: string): Promise<AuthResponse> => {
      console.log('Auth store: Attempting login with email');
      
      const response = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (response.error) {
        console.error('Auth store: Login error', response.error);
      }
      
      return response;
    },
    signUp: async (email: string, password: string, name?: string): Promise<AuthResponse> => {
      console.log('Auth store: Attempting sign up with email');
      
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });
      
      if (response.error) {
        console.error('Auth store: Sign up error', response.error);
      }
      
      return response;
    },
    logout: async () => {
      console.log('Auth store: Logging out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Auth store: Logout error', error);
      }
      
      return error;
    },
    initialize
  };
};

// Export the auth store
export const authStore = createAuthStore();

// Initialize the store when the module is imported
if (browser) {
  // Initialize immediately to avoid delays
  authStore.initialize();
} 