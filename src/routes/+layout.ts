import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';
import type { LayoutLoad } from './$types';

// Public routes that don't require authentication
const publicRoutes = ['/login', '/register'];

// Helper to check if we're on a public route
const isPublicRoute = (path: string) => {
  return publicRoutes.some(route => path === route || path.startsWith(`${route}/`));
};

export const load: LayoutLoad = async ({ url }) => {
  if (browser) {
    const currentPath = url.pathname;
    
    // Create a promise that resolves when auth is initialized
    const waitForAuth = new Promise<{isAuthenticated: boolean, loading: boolean}>((resolve) => {
      // Initialize unsubscribe as a no-op function
      let unsubscribe = () => {};
      
      try {
        // Set up the subscription
        unsubscribe = authStore.subscribe(state => {
          if (!state.loading) {
            resolve(state);
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          }
        });
        
        // Safety timeout after 1 second in case auth never initializes
        setTimeout(() => {
          const currentState = get(authStore);
          if (currentState.loading) {
            resolve({...currentState, loading: false});
            if (typeof unsubscribe === 'function') {
              unsubscribe();
            }
          }
        }, 1000);
      } catch (error) {
        console.error('Error in auth subscription:', error);
        // Resolve with a safe default state
        resolve({ isAuthenticated: false, loading: false });
      }
    });
    
    // Wait for auth state to be ready
    const { isAuthenticated } = await waitForAuth;
    
    console.log(`Layout load: path=${currentPath}, isAuthenticated=${isAuthenticated}, public=${isPublicRoute(currentPath)}`);
    
    // If not authenticated and trying to access a protected route (including profile)
    if (!isAuthenticated && !isPublicRoute(currentPath)) {
      console.log('Redirecting to login: not authenticated on protected route');
      // Use replaceState true to avoid history problems
      goto('/login', { replaceState: true });
    }
    
    // If authenticated and trying to access login/register
    if (isAuthenticated && isPublicRoute(currentPath)) {
      console.log('Redirecting to home: authenticated on public route');
      // Use replaceState true to avoid history problems
      goto('/', { replaceState: true });
    }
    
    return { isAuthenticated };
  }
  
  // When running on server, assume not authenticated for safety
  return { isAuthenticated: false };
}; 