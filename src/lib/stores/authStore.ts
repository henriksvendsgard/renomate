import { writable } from 'svelte/store';
import type { User } from '$lib/types';
import { browser } from '$app/environment';

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
  const initialize = () => {
    if (!browser) {
      // When not in browser, immediately set loading to false
      update(state => ({ ...state, loading: false }));
      return;
    }
    
    console.log('Auth store initializing...');
    
    try {
      // Try to get user from localStorage
      const savedUser = localStorage.getItem('auth_user');
      
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser) as User;
          console.log('Auth store: Found saved user');
          
          update(state => ({
            ...state,
            user,
            isAuthenticated: true,
            loading: false
          }));
        } catch (e) {
          console.error('Auth store: Error parsing saved user', e);
          // Invalid stored data, remove it
          localStorage.removeItem('auth_user');
          update(state => ({ ...state, loading: false }));
        }
      } else {
        console.log('Auth store: No saved user found');
        update(state => ({ ...state, loading: false }));
      }
    } catch (e) {
      console.error('Auth store: Initialization error', e);
      update(state => ({ ...state, loading: false }));
    }
  };

  // Define the store methods
  return {
    subscribe,
    login: (user: User) => {
      console.log('Auth store: Logging in user', user.id);
      
      // Update state immediately without touching localStorage
      // (we'll handle localStorage separately for better control)
      return update(state => ({
        ...state,
        user,
        isAuthenticated: true,
        loading: false
      }));
    },
    logout: () => {
      console.log('Auth store: Logging out user');
      
      // Update state immediately without touching localStorage
      // (we'll handle localStorage separately for better control)
      return set({
        user: null,
        isAuthenticated: false,
        loading: false
      });
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