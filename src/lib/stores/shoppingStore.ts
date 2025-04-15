import { writable, derived } from 'svelte/store';
import type { ShoppingItem } from '$lib/types';
import { shoppingService } from '$lib/services/db';
import { browser } from '$app/environment';

// Initialize with empty array
const initialItems: ShoppingItem[] = [];

function createShoppingStore() {
  const { subscribe, set, update } = writable<ShoppingItem[]>(initialItems);

  return {
    subscribe,
    
    // Load shopping items from the database for a specific user
    async load(userId?: string) {
      if (browser) {
        try {
          const items = userId ? 
            await shoppingService.getAllForUser(userId) : 
            await shoppingService.getAll();
          
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
        await this.load(item.userId);
        return id;
      }
    },
    
    // Update a shopping item
    async update(id: string, updates: Partial<Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>>) {
      if (browser) {
        await shoppingService.update(id, updates);
        const item = await shoppingService.getById(id);
        if (item) {
          await this.load(item.userId);
        }
      }
    },
    
    // Delete a shopping item
    async delete(id: string, userId: string) {
      if (browser) {
        await shoppingService.delete(id);
        await this.load(userId);
      }
    },
    
    // Toggle completion status of an item
    async toggleCompleted(id: string, userId: string) {
      if (browser) {
        await shoppingService.toggleCompleted(id);
        await this.load(userId);
      }
    },
    
    // Clear all completed items
    async clearCompleted(userId: string) {
      if (browser) {
        await shoppingService.deleteCompleted(userId);
        await this.load(userId);
      }
    }
  };
}

export const shoppingStore = createShoppingStore();

// Derived store for active (not completed) items
export const activeItems = derived(shoppingStore, $items => 
  $items.filter(item => !item.completed)
);

// Derived store for completed items
export const completedItems = derived(shoppingStore, $items => 
  $items.filter(item => item.completed)
); 