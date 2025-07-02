import { supabase } from '$lib/supabase';
import type { House, Room, Task, ShoppingItem } from '$lib/types';
import { authStore } from '$lib/stores/authStore';
import { get } from 'svelte/store';

// Helper function to get current user ID
function getCurrentUserId(): string {
  const auth = get(authStore);
  if (!auth.user) {
    throw new Error('User not authenticated');
  }
  return auth.user.id;
}

// House operations
export const houseService = {
  async getAll(): Promise<House[]> {
    console.log('DB: Getting all houses for current user');
    
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
      
      // Map database fields to our types
      const houses: House[] = data.map(dbHouse => ({
        id: dbHouse.id,
        userId: dbHouse.user_id,
        name: dbHouse.name,
        address: dbHouse.address,
        photo: dbHouse.photo,
        createdAt: dbHouse.created_at,
        updatedAt: dbHouse.updated_at
      }));
      
      console.log('DB: Retrieved houses:', houses);
      return houses;
    } catch (err) {
      console.error('Error fetching houses:', err);
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
      
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        address: data.address,
        photo: data.photo,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error('Error fetching house:', err);
      return undefined;
    }
  },
  
  async add(house: { name: string; address?: string; photo?: string }): Promise<string> {
    try {
      const now = new Date().toISOString();
      const userId = getCurrentUserId();
      const houseId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('houses')
        .insert({
          id: houseId,
          user_id: userId,
          name: house.name,
          address: house.address,
          photo: house.photo,
          created_at: now,
          updated_at: now
        })
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
      
      const dbUpdates: {
        updated_at: string;
        name?: string;
        address?: string;
        photo?: string;
      } = {
        updated_at: now
      };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.photo !== undefined) dbUpdates.photo = updates.photo;
      
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
  }
};

// Room operations
export const roomService = {
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
      
      // Map database fields to our types
      const rooms: Room[] = data.map(dbRoom => ({
        id: dbRoom.id,
        houseId: dbRoom.house_id,
        name: dbRoom.name,
        budget: dbRoom.budget,
        deadline: dbRoom.deadline,
        thumbnail: dbRoom.thumbnail,
        photos: dbRoom.photos || [],
        tasks: dbRoom.tasks || [],
        createdAt: dbRoom.created_at,
        updatedAt: dbRoom.updated_at
      }));
      
      return rooms;
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
      
      return {
        id: data.id,
        houseId: data.house_id,
        name: data.name,
        budget: data.budget,
        deadline: data.deadline,
        thumbnail: data.thumbnail,
        photos: data.photos || [],
        tasks: data.tasks || [],
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    } catch (err) {
      console.error('Error fetching room:', err);
      return undefined;
    }
  },
  
  async add(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const roomId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('rooms')
        .insert({
          id: roomId,
          house_id: room.houseId,
          name: room.name,
          budget: room.budget,
          deadline: room.deadline,
          thumbnail: room.thumbnail,
          photos: room.photos || [],
          tasks: room.tasks || [],
          created_at: now,
          updated_at: now
        })
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
      
      const dbUpdates: {
        updated_at: string;
        name?: string;
        budget?: number;
        deadline?: string;
        thumbnail?: string;
        photos?: string[];
        tasks?: Task[];
      } = {
        updated_at: now
      };
      
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.budget !== undefined) dbUpdates.budget = updates.budget;
      if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
      if (updates.thumbnail !== undefined) dbUpdates.thumbnail = updates.thumbnail;
      if (updates.photos !== undefined) dbUpdates.photos = updates.photos;
      if (updates.tasks !== undefined) dbUpdates.tasks = updates.tasks;
      
      const { error } = await supabase
        .from('rooms')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('DB error updating room:', error);
        throw error;
      }
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
      
      // Create updated tasks array
      const updatedTasks = [...room.tasks];
      updatedTasks[taskIndex] = {
        ...updatedTasks[taskIndex],
        ...updates,
        updatedAt: now
      };
      
      // Update the room with the updated tasks array
      await roomService.update(roomId, {
        tasks: updatedTasks
      });
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

// Shopping service
export const shoppingService = {
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
      
      // Map database fields to our types
      const items: ShoppingItem[] = data.map(dbItem => ({
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
      }));
      
      return items;
    } catch (err) {
      console.error('Error fetching shopping items for user:', err);
      return [];
    }
  },
  
  async add(item: Omit<ShoppingItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const itemId = crypto.randomUUID();
      
      const { data, error } = await supabase
        .from('shopping_items')
        .insert({
          id: itemId,
          user_id: item.userId,
          title: item.title,
          completed: item.completed,
          quantity: item.quantity,
          note: item.note,
          unit: item.unit,
          category: item.category,
          created_at: now,
          updated_at: now
        })
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
      
      const dbUpdates: {
        updated_at: string;
        title?: string;
        completed?: boolean;
        quantity?: number;
        note?: string;
        unit?: string;
        category?: string;
      } = {
        updated_at: now
      };
      
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.note !== undefined) dbUpdates.note = updates.note;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      
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
      const { data, error: fetchError } = await supabase
        .from('shopping_items')
        .select('completed')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        console.error('DB error getting shopping item:', fetchError);
        throw fetchError;
      }
      
      // Toggle completed status
      await this.update(id, { completed: !data.completed });
    } catch (err) {
      console.error('Error toggling shopping item completion:', err);
      throw err;
    }
  }
}; 