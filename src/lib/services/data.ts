import { houseService, roomService, shoppingService } from '$lib/services/db';
import type { House, Room, ShoppingItem } from '$lib/types';
import { get } from 'svelte/store';
import { authStore } from '$lib/stores/authStore';

/**
 * Service for importing/exporting app data
 */

/**
 * Export all house and room data as a JSON string for the current user
 */
export async function exportData(): Promise<string> {
  try {
    // Get the current user ID from the auth store
    const currentUser = get(authStore).user;
    
    if (!currentUser || !currentUser.id) {
      throw new Error('No logged in user found');
    }
    
    // Get only houses that belong to the current user
    const houses = await houseService.getAllForUser(currentUser.id);
    
    // Collect all room IDs from these houses
    const rooms: Room[] = [];
    for (const house of houses) {
      const houseRooms = await roomService.getAllForHouse(house.id);
      rooms.push(...houseRooms);
    }
    
    // Get shopping items for the current user
    const shoppingItems = await shoppingService.getAllForUser(currentUser.id);
    
    // Create an export object with metadata
    const exportData = {
      version: 3, // Increment version for new data structure with shopping items
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      data: {
        houses,
        rooms,
        shoppingItems
      }
    };
    
    // Convert to JSON string
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting data:', error);
    throw new Error('Failed to export data');
  }
}

/**
 * Import data from a JSON string
 */
export async function importData(jsonString: string): Promise<{ success: boolean, message: string }> {
  try {
    // Parse the JSON data
    const importData = JSON.parse(jsonString);
    
    // Validate data structure
    if (!importData || !importData.data || !importData.data.houses || !importData.data.rooms || 
        !Array.isArray(importData.data.houses) || !Array.isArray(importData.data.rooms)) {
      return { success: false, message: 'Invalid data format' };
    }
    
    // Check version compatibility
    if (importData.version < 2) {
      return { success: false, message: 'Incompatible data version' };
    }
    
    const houses = importData.data.houses as House[];
    const rooms = importData.data.rooms as Room[];
    const shoppingItems = (importData.version >= 3 && importData.data.shoppingItems) 
      ? importData.data.shoppingItems as ShoppingItem[]
      : [];
    
    // Validate house data
    for (const house of houses) {
      if (!house.id || !house.name) {
        return { success: false, message: 'Invalid house data found' };
      }
    }
    
    // Validate room data and house references
    for (const room of rooms) {
      if (!room.id || !room.name || !room.houseId || typeof room.budget !== 'number' || !Array.isArray(room.tasks)) {
        return { success: false, message: 'Invalid room data found' };
      }
      // Verify room references a valid house
      if (!houses.some(house => house.id === room.houseId)) {
        return { success: false, message: 'Room references non-existent house' };
      }
    }
    
    // Validate shopping items if present
    if (shoppingItems.length > 0) {
      for (const item of shoppingItems) {
        if (!item.id || !item.title || typeof item.completed !== 'boolean') {
          return { success: false, message: 'Invalid shopping item data found' };
        }
      }
    }
    
    // Clear existing data
    const existingHouses = await houseService.getAll();
    for (const house of existingHouses) {
      await houseService.delete(house.id);
    }
    
    // Clear existing shopping items if we're importing them
    if (shoppingItems.length > 0 && importData.userId) {
      const existingItems = await shoppingService.getAllForUser(importData.userId);
      for (const item of existingItems) {
        await shoppingService.delete(item.id);
      }
    }
    
    // Import houses first
    for (const house of houses) {
      await houseService.add(house as any);
    }
    
    // Then import rooms
    for (const room of rooms) {
      await roomService.add(room as any);
    }
    
    // Import shopping items if present
    if (shoppingItems.length > 0) {
      for (const item of shoppingItems) {
        await shoppingService.add(item as any);
      }
    }
    
    return { 
      success: true, 
      message: `Successfully imported ${houses.length} houses, ${rooms.length} rooms${shoppingItems.length > 0 ? ` and ${shoppingItems.length} shopping items` : ''}` 
    };
  } catch (error) {
    console.error('Error importing data:', error);
    return { success: false, message: 'Failed to import data: ' + (error as Error).message };
  }
}

/**
 * Clear all data from the database
 */
export async function clearAllData(): Promise<{ success: boolean, message: string }> {
  try {
    // Get all houses
    const houses = await houseService.getAll();
    
    // Delete each house (this will cascade delete rooms due to our service implementation)
    for (const house of houses) {
      await houseService.delete(house.id);
    }
    
    // Get the current user ID from the auth store for shopping items
    const currentUser = get(authStore).user;
    let shoppingItemsDeleted = 0;
    
    // Delete shopping items for the current user if logged in
    if (currentUser && currentUser.id) {
      const items = await shoppingService.getAllForUser(currentUser.id);
      for (const item of items) {
        await shoppingService.delete(item.id);
      }
      shoppingItemsDeleted = items.length;
    }
    
    return { 
      success: true, 
      message: `Successfully deleted ${houses.length} houses, all associated rooms${shoppingItemsDeleted > 0 ? ` and ${shoppingItemsDeleted} shopping items` : ''}` 
    };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, message: 'Failed to clear data' };
  }
} 