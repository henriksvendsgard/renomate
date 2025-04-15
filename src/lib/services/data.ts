import { houseService, roomService } from '$lib/services/db';
import type { House, Room } from '$lib/types';

/**
 * Service for importing/exporting app data
 */

/**
 * Export all house and room data as a JSON string
 */
export async function exportData(): Promise<string> {
  try {
    // Get all houses and rooms from the database
    const houses = await houseService.getAll();
    const rooms = await roomService.getAll();
    
    // Create an export object with metadata
    const exportData = {
      version: 2, // Increment version for new data structure
      timestamp: new Date().toISOString(),
      data: {
        houses,
        rooms
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
    if (importData.version !== 2) {
      return { success: false, message: 'Incompatible data version' };
    }
    
    const houses = importData.data.houses as House[];
    const rooms = importData.data.rooms as Room[];
    
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
    
    // Clear existing data
    const existingHouses = await houseService.getAll();
    for (const house of existingHouses) {
      await houseService.delete(house.id);
    }
    
    // Import houses first
    for (const house of houses) {
      await houseService.add(house as any);
    }
    
    // Then import rooms
    for (const room of rooms) {
      await roomService.add(room as any);
    }
    
    return { 
      success: true, 
      message: `Successfully imported ${houses.length} houses and ${rooms.length} rooms` 
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
    
    return { 
      success: true, 
      message: `Successfully deleted ${houses.length} houses and all associated rooms` 
    };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, message: 'Failed to clear data' };
  }
} 