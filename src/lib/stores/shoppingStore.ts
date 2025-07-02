import { writable, derived } from 'svelte/store';
import type { ShoppingItem } from '$lib/types';
import { shoppingService } from '$lib/services/dbService';
import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore';

// Initialize with empty array
const initialItems: ShoppingItem[] = [];

function createShoppingStore() {
  const { subscribe, set } = writable<ShoppingItem[]>(initialItems);

  return {
    subscribe,
    
    // Load shopping items from the database for the current user
    async load() {
      if (browser) {
        try {
          const currentUser = get(authStore).user;
          if (!currentUser?.id) {
            console.warn('Shopping store: No authenticated user, cannot load items');
            set([]);
            return;
          }
          
          const items = await shoppingService.getAllForUser(currentUser.id);
          
          console.log('Shopping store: Loaded items:', items);
          set(items);
        } catch (error) {
          console.error('Shopping store: Error loading items:', error);
          // Set empty array on error to avoid stuck loading state
          set([]);
          throw error;
        }
      }
    },
    
    // Add a new shopping item
    async add(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>) {
      if (browser) {
        const id = await shoppingService.add(item);
        await this.load();
        return id;
      }
    },
    
    // Update a shopping item
    async update(id: string, updates: Partial<Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>>) {
      if (browser) {
        await shoppingService.update(id, updates);
        await this.load();
      }
    },
    
    // Delete a shopping item
    async delete(id: string) {
      if (browser) {
        await shoppingService.delete(id);
        await this.load();
      }
    },
    
    // Toggle completion status of an item
    async toggleCompleted(id: string) {
      if (browser) {
        await shoppingService.toggleCompleted(id);
        await this.load();
      }
    }
  };
}

export const shoppingStore = createShoppingStore();

// Helper function to sort items by creation date (newest first)
const sortByNewestFirst = (items: ShoppingItem[]) => {
  return [...items].sort((a, b) => {
    // If createdAt doesn't exist on either item, use current time for comparison
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : Date.now();
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : Date.now();
    return dateB - dateA; // Sort descending (newest first)
  });
};

// Derived store for active (not completed) items sorted by newest first
export const activeItems = derived(shoppingStore, $items => 
  sortByNewestFirst($items.filter(item => !item.completed))
);

// Derived store for completed items sorted by newest first
export const completedItems = derived(shoppingStore, $items => 
  sortByNewestFirst($items.filter(item => item.completed))
); 