import { supabase } from '$lib/supabase';
import type { House, Room, Task, ShoppingItem, User } from '$lib/types';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';
import { browser } from '$app/environment';

// Helper function to get current user ID
function getCurrentUserId(): string {
  const auth = get(authStore);
  if (!auth.user) {
    throw new Error('User not authenticated');
  }
  return auth.user.id;
}

// Mapper functions for ShoppingItem to handle snake_case in Supabase
function mapToShoppingItem(dbItem: any): ShoppingItem {
  return {
    id: dbItem.id,
    userId: dbItem.user_id,
    title: dbItem.title,
    completed: dbItem.completed,
    quantity: dbItem.quantity || 1,
    note: dbItem.note,
    unit: dbItem.unit,
    category: dbItem.category,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at
  };
}

function mapToDbShoppingItem(item: Partial<ShoppingItem>): Record<string, any> {
  const dbItem: Record<string, any> = {};
  
  if (item.id !== undefined) dbItem.id = item.id;
  if (item.userId !== undefined) dbItem.user_id = item.userId;
  if (item.title !== undefined) dbItem.title = item.title;
  if (item.completed !== undefined) dbItem.completed = item.completed;
  if (item.quantity !== undefined) dbItem.quantity = item.quantity;
  if (item.note !== undefined) dbItem.note = item.note;
  if (item.unit !== undefined) dbItem.unit = item.unit;
  if (item.category !== undefined) dbItem.category = item.category;
  if (item.createdAt !== undefined) dbItem.created_at = item.createdAt;
  if (item.updatedAt !== undefined) dbItem.updated_at = item.updatedAt;
  
  return dbItem;
}

// Mapper functions for House objects
function mapToHouse(dbItem: any): House {
  return {
    id: dbItem.id,
    userId: dbItem.user_id,
    name: dbItem.name,
    address: dbItem.address,
    photo: dbItem.photo,
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at
  };
}

function mapToDbHouse(item: Partial<House>): Record<string, any> {
  const dbItem: Record<string, any> = {};
  
  if (item.id !== undefined) dbItem.id = item.id;
  if (item.userId !== undefined) dbItem.user_id = item.userId;
  if (item.name !== undefined) dbItem.name = item.name;
  if (item.address !== undefined) dbItem.address = item.address;
  if (item.photo !== undefined) dbItem.photo = item.photo;
  if (item.createdAt !== undefined) dbItem.created_at = item.createdAt;
  if (item.updatedAt !== undefined) dbItem.updated_at = item.updatedAt;
  
  return dbItem;
}

// Mapper functions for Room objects
function mapToRoom(dbItem: any): Room {
  return {
    id: dbItem.id,
    houseId: dbItem.house_id,
    name: dbItem.name,
    budget: dbItem.budget,
    deadline: dbItem.deadline,
    thumbnail: dbItem.thumbnail,
    photos: dbItem.photos || [],
    tasks: dbItem.tasks || [],
    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at
  };
}

function mapToDbRoom(item: Partial<Room>): Record<string, any> {
  const dbItem: Record<string, any> = {};
  
  if (item.id !== undefined) dbItem.id = item.id;
  if (item.houseId !== undefined) dbItem.house_id = item.houseId;
  if (item.name !== undefined) dbItem.name = item.name;
  if (item.budget !== undefined) dbItem.budget = item.budget;
  if (item.deadline !== undefined) dbItem.deadline = item.deadline;
  if (item.thumbnail !== undefined) dbItem.thumbnail = item.thumbnail;
  if (item.photos !== undefined) dbItem.photos = item.photos;
  if (item.tasks !== undefined) dbItem.tasks = item.tasks;
  if (item.createdAt !== undefined) dbItem.created_at = item.createdAt;
  if (item.updatedAt !== undefined) dbItem.updated_at = item.updatedAt;
  
  return dbItem;
}

// House operations
export const houseService = {
  async getAll(): Promise<House[]> {
    console.log('DB: Getting all houses');
    
    try {
      const userId = getCurrentUserId();
      
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('DB error getting houses:', error);
        return [];
      }
      
      console.log('DB: Retrieved houses:', data);
      return data.map(mapToHouse);
    } catch (err) {
      console.error('Error fetching houses:', err);
      return [];
    }
  },
  
  async getAllForUser(userId: string): Promise<House[]> {
    console.log('DB: Getting houses for user:', userId);
    
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('DB error getting houses for user:', error);
        return [];
      }
      
      console.log('DB: Retrieved houses for user:', data);
      return data.map(mapToHouse);
    } catch (err) {
      console.error('Error fetching houses for user:', err);
      return [];
    }
  },
  
  async getById(id: string): Promise<House | undefined> {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('DB error getting house by id:', error);
        return undefined;
      }
      
      return mapToHouse(data);
    } catch (err) {
      console.error('Error fetching house:', err);
      return undefined;
    }
  },
  
  async add(house: Omit<House, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const userId = getCurrentUserId();
      
      // Create a new house with the current user ID
      const newHouse = {
        ...house,
        id: crypto.randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now
      };
      
      const dbHouse = mapToDbHouse(newHouse);
      
      const { data, error } = await supabase
        .from('houses')
        .insert(dbHouse)
        .select()
        .single();
      
      if (error) {
        console.error('DB error adding house:', error);
        throw error;
      }
      
      return data.id;
    } catch (err) {
      console.error('Error adding house:', err);
      throw err;
    }
  },
  
  async update(id: string, updates: Partial<Omit<House, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updatesWithTimestamp = { ...updates, updatedAt: now };
      const dbUpdates = mapToDbHouse(updatesWithTimestamp);
      
      const { error } = await supabase
        .from('houses')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('DB error updating house:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error updating house:', err);
      throw err;
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      // First, get all rooms for this house
      const rooms = await roomService.getAllForHouse(id);
      
      // Delete all rooms
      for (const room of rooms) {
        await roomService.delete(room.id);
      }
      
      // Delete the house
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('DB error deleting house:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting house:', err);
      throw err;
    }
  },

  // Add this method to delete all houses for a user when they delete their account
  async deleteAllForUser(userId: string): Promise<void> {
    try {
      const userHouses = await this.getAllForUser(userId);
      for (const house of userHouses) {
        await this.delete(house.id);
      }
    } catch (err) {
      console.error('Error deleting houses for user:', err);
      throw err;
    }
  }
};

// Room operations
export const roomService = {
  async getAll(): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('DB error getting all rooms:', error);
        return [];
      }
      
      return data.map(mapToRoom);
    } catch (err) {
      console.error('Error fetching all rooms:', err);
      return [];
    }
  },
  
  async getAllForHouse(houseId: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('house_id', houseId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('DB error getting rooms for house:', error);
        return [];
      }
      
      return data.map(mapToRoom);
    } catch (err) {
      console.error('Error fetching rooms for house:', err);
      return [];
    }
  },
  
  async getById(id: string): Promise<Room | undefined> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('DB error getting room by id:', error);
        return undefined;
      }
      
      return mapToRoom(data);
    } catch (err) {
      console.error('Error fetching room:', err);
      return undefined;
    }
  },
  
  async add(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const newRoom = {
        ...room,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        tasks: room.tasks || []
      };
      
      const dbRoom = mapToDbRoom(newRoom);
      
      const { data, error } = await supabase
        .from('rooms')
        .insert(dbRoom)
        .select()
        .single();
      
      if (error) {
        console.error('DB error adding room:', error);
        throw error;
      }
      
      return data.id;
    } catch (err) {
      console.error('Error adding room:', err);
      throw err;
    }
  },
  
  async update(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // If updating photos, ensure it's an array
      if ('photos' in updates) {
        console.log('DB update with photos:', updates.photos ? `${updates.photos.length} photos` : 'no photos');
        
        // Safety check - ensure photos is an array
        if (!Array.isArray(updates.photos)) {
          console.warn('Photos is not an array, fixing');
          updates.photos = [];
        }
        
        // For safety, validate each photo is a string
        if (updates.photos.length > 0) {
          updates.photos = updates.photos.filter(photo => {
            const isValid = typeof photo === 'string' && photo.startsWith('data:');
            if (!isValid) {
              console.warn('Removing invalid photo entry');
            }
            return isValid;
          });
        }
      }
      
      const updatesWithTimestamp = { ...updates, updatedAt: now };
      const dbUpdates = mapToDbRoom(updatesWithTimestamp);
      
      // Perform the update
      const { error } = await supabase
        .from('rooms')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('DB error updating room:', error);
        throw error;
      }
      
      console.log('Room updated successfully in DB');
    } catch (err) {
      console.error('Error updating room:', err);
      throw err;
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('DB error deleting room:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting room:', err);
      throw err;
    }
  }
};

// Task operations within rooms
export const taskService = {
  async addTask(roomId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Get the current room
      const room = await roomService.getById(roomId);
      if (!room) throw new Error('Room not found');
      
      const now = new Date().toISOString();
      const id = crypto.randomUUID();
      const newTask: Task = {
        ...task,
        id,
        createdAt: now,
        updatedAt: now
      };
      
      // Add the new task to the room's tasks array
      const updatedTasks = [...(room.tasks || []), newTask];
      
      // Update the room with the new tasks array
      await roomService.update(roomId, {
        tasks: updatedTasks
      });
      
      return id;
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  },
  
  async updateTask(roomId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      // Get the current room
      const room = await roomService.getById(roomId);
      if (!room) throw new Error('Room not found');
      
      const now = new Date().toISOString();
      const taskIndex = room.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) throw new Error('Task not found');
      
      console.debug(`Updating task ${taskId} in room ${roomId}:`, updates);
      
      // Create updated tasks array
      const updatedTasks = [...room.tasks];
      const oldTask = { ...updatedTasks[taskIndex] };
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...updates,
        updatedAt: now
      };
      
      console.debug(`Task ${taskId} state change:`, {
        before: { done: oldTask.done, cost: oldTask.cost },
        after: { done: updatedTasks[taskIndex].done, cost: updatedTasks[taskIndex].cost }
      });
      
      // Update the room with the updated tasks array
      await roomService.update(roomId, {
        tasks: updatedTasks
      });
      
      console.debug(`Task ${taskId} updated in database`);
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  },
  
  async deleteTask(roomId: string, taskId: string): Promise<void> {
    try {
      // Get the current room
      const room = await roomService.getById(roomId);
      if (!room) throw new Error('Room not found');
      
      // Filter out the task to delete
      const updatedTasks = room.tasks.filter(t => t.id !== taskId);
      
      // Update the room with the filtered tasks array
      await roomService.update(roomId, {
        tasks: updatedTasks
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }
};

// Since you're planning to revise the shopping list functionality later,
// We'll include a limited version of the shopping service here for compatibility
export const shoppingService = {
  async getAll(): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('DB error getting all shopping items:', error);
        return [];
      }
      
      return data.map(mapToShoppingItem);
    } catch (err) {
      console.error('Error fetching all shopping items:', err);
      return [];
    }
  },
  
  async getAllForUser(userId: string): Promise<ShoppingItem[]> {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('DB error getting shopping items for user:', error);
        return [];
      }
      
      return data.map(mapToShoppingItem);
    } catch (err) {
      console.error('Error fetching shopping items for user:', err);
      return [];
    }
  },
  
  async getById(id: string): Promise<ShoppingItem | undefined> {
    try {
      const { data, error } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('DB error getting shopping item by id:', error);
        return undefined;
      }
      
      return mapToShoppingItem(data);
    } catch (err) {
      console.error('Error fetching shopping item:', err);
      return undefined;
    }
  },
  
  async add(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const newItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now
      };
      
      const dbItem = mapToDbShoppingItem(newItem);
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert(dbItem)
        .select()
        .single();
      
      if (error) {
        console.error('DB error adding shopping item:', error);
        throw error;
      }
      
      return data.id;
    } catch (err) {
      console.error('Error adding shopping item:', err);
      throw err;
    }
  },
  
  async update(id: string, updates: Partial<Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const now = new Date().toISOString();
      const updatesWithTimestamp = { ...updates, updatedAt: now };
      const dbUpdates = mapToDbShoppingItem(updatesWithTimestamp);
      
      const { error } = await supabase
        .from('shopping_items')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('DB error updating shopping item:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error updating shopping item:', err);
      throw err;
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('DB error deleting shopping item:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting shopping item:', err);
      throw err;
    }
  },
  
  async toggleCompleted(id: string): Promise<void> {
    try {
      // First, get the current item
      const item = await this.getById(id);
      if (!item) throw new Error('Shopping item not found');
      
      // Toggle completed status
      await this.update(id, { completed: !item.completed });
    } catch (err) {
      console.error('Error toggling shopping item completion:', err);
      throw err;
    }
  },
  
  async deleteAllForUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        console.error('DB error deleting all shopping items for user:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting all shopping items for user:', err);
      throw err;
    }
  },
  
  async deleteCompleted(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shopping_items')
        .delete()
        .eq('user_id', userId)
        .eq('completed', true);
      
      if (error) {
        console.error('DB error deleting completed shopping items:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting completed shopping items:', err);
      throw err;
    }
  }
}; 