import { roomService } from '$lib/services/db';
import type { Room } from '$lib/types';

/**
 * Service for importing/exporting app data
 */

/**
 * Export all room data as a JSON string
 */
export async function exportData(): Promise<string> {
  try {
    // Get all rooms from the database
    const rooms = await roomService.getAll();
    
    // Create an export object with metadata
    const exportData = {
      version: 1,
      timestamp: new Date().toISOString(),
      data: {
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
    if (!importData || !importData.data || !importData.data.rooms || !Array.isArray(importData.data.rooms)) {
      return { success: false, message: 'Invalid data format' };
    }
    
    // Check version compatibility
    if (importData.version !== 1) {
      return { success: false, message: 'Incompatible data version' };
    }
    
    const rooms = importData.data.rooms as Room[];
    
    // Validate each room has the required properties
    for (const room of rooms) {
      if (!room.id || !room.name || typeof room.budget !== 'number' || !Array.isArray(room.tasks)) {
        return { success: false, message: 'Invalid room data found' };
      }
    }
    
    // Clear existing rooms and import new ones
    // Get existing rooms to delete them
    const existingRooms = await roomService.getAll();
    
    // Delete all existing rooms
    for (const room of existingRooms) {
      await roomService.delete(room.id);
    }
    
    // Import new rooms
    for (const room of rooms) {
      await roomService.add(room as any); // Type casting as any to bypass strict type checking
    }
    
    return { success: true, message: `Successfully imported ${rooms.length} rooms` };
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
    // Get all rooms
    const rooms = await roomService.getAll();
    
    // Delete each room
    for (const room of rooms) {
      await roomService.delete(room.id);
    }
    
    return { success: true, message: `Successfully deleted ${rooms.length} rooms` };
  } catch (error) {
    console.error('Error clearing data:', error);
    return { success: false, message: 'Failed to clear data' };
  }
} 