import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Check if the user is authenticated and redirect to login if not
 * @returns True if the user is authenticated, false otherwise
 */
export function requireAuth(): boolean {
  if (!browser) return false;
  
  const auth = get(authStore);
  
  if (!auth.isAuthenticated && !auth.loading) {
    goto('/login');
    return false;
  }
  
  return auth.isAuthenticated;
}

/**
 * Check if the user is authenticated
 * @returns True if the user is authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  if (!browser) return false;
  
  const auth = get(authStore);
  return auth.isAuthenticated;
} 