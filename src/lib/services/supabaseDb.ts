import { supabase } from '$lib/supabase';
import type { House, Room, Task } from '$lib/types';
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
export const supabaseHouseService = {
  async getAll(): Promise<House[]> {
    console.log('Supabase: Getting all houses');
    
    try {
      const userId = getCurrentUserId();
      
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Supabase error getting houses:', error);
        throw error;
      }
      
      console.log('Supabase: Retrieved houses:', data);
      return data as House[];
    } catch (err) {
      console.error('Error fetching houses from Supabase:', err);
      return [];
    }
  },
  
  async getById(id: string): Promise<House | null> {
    try {
      const { data, error } = await supabase
        .from('houses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Supabase error getting house by id:', error);
        return null;
      }
      
      return data as House;
    } catch (err) {
      console.error('Error fetching house from Supabase:', err);
      return null;
    }
  },
  
  async add(house: Omit<House, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const userId = getCurrentUserId();
      
      // Ensure the house is linked to the current user
      const newHouse: House = {
        ...house,
        id: crypto.randomUUID(),
        userId,
        createdAt: now,
        updatedAt: now
      };
      
      const { data, error } = await supabase
        .from('houses')
        .insert(newHouse)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error adding house:', error);
        throw error;
      }
      
      return data.id;
    } catch (err) {
      console.error('Error adding house to Supabase:', err);
      throw err;
    }
  },
  
  async update(id: string, updates: Partial<Omit<House, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      const { error } = await supabase
        .from('houses')
        .update({ ...updates, updatedAt: now })
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error updating house:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error updating house in Supabase:', err);
      throw err;
    }
  },
  
  async delete(id: string): Promise<void> {
    try {
      // First, delete all associated rooms
      await supabaseRoomService.deleteAllForHouse(id);
      
      // Then delete the house
      const { error } = await supabase
        .from('houses')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error deleting house:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting house from Supabase:', err);
      throw err;
    }
  }
};

// Room operations
export const supabaseRoomService = {
  async getAllForHouse(houseId: string): Promise<Room[]> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('houseId', houseId)
        .order('createdAt', { ascending: false });
      
      if (error) {
        console.error('Supabase error getting rooms:', error);
        throw error;
      }
      
      return data as Room[];
    } catch (err) {
      console.error('Error fetching rooms from Supabase:', err);
      return [];
    }
  },
  
  async getById(id: string): Promise<Room | null> {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Supabase error getting room by id:', error);
        return null;
      }
      
      return data as Room;
    } catch (err) {
      console.error('Error fetching room from Supabase:', err);
      return null;
    }
  },
  
  async add(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      
      const newRoom: Room = {
        ...room,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
        tasks: room.tasks || []
      };
      
      const { data, error } = await supabase
        .from('rooms')
        .insert(newRoom)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase error adding room:', error);
        throw error;
      }
      
      return data.id;
    } catch (err) {
      console.error('Error adding room to Supabase:', err);
      throw err;
    }
  },
  
  async update(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      const now = new Date().toISOString();
      
      // Safety check for photos
      if ('photos' in updates && !Array.isArray(updates.photos)) {
        updates.photos = [];
      }
      
      const { error } = await supabase
        .from('rooms')
        .update({ ...updates, updatedAt: now })
        .eq('id', id);
      
      if (error) {
        console.error('Supabase error updating room:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error updating room in Supabase:', err);
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
        console.error('Supabase error deleting room:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting room from Supabase:', err);
      throw err;
    }
  },
  
  async deleteAllForHouse(houseId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('houseId', houseId);
      
      if (error) {
        console.error('Supabase error deleting rooms for house:', error);
        throw error;
      }
    } catch (err) {
      console.error('Error deleting rooms for house from Supabase:', err);
      throw err;
    }
  }
};

// Task operations
export const supabaseTaskService = {
  async addTask(roomId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      // Get the current room
      const room = await supabaseRoomService.getById(roomId);
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
      await supabaseRoomService.update(roomId, { tasks: updatedTasks });
      
      return id;
    } catch (err) {
      console.error('Error adding task to Supabase:', err);
      throw err;
    }
  },
  
  async updateTask(roomId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    try {
      // Get the current room
      const room = await supabaseRoomService.getById(roomId);
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
      await supabaseRoomService.update(roomId, { tasks: updatedTasks });
    } catch (err) {
      console.error('Error updating task in Supabase:', err);
      throw err;
    }
  },
  
  async deleteTask(roomId: string, taskId: string): Promise<void> {
    try {
      // Get the current room
      const room = await supabaseRoomService.getById(roomId);
      if (!room) throw new Error('Room not found');
      
      // Filter out the task to delete
      const updatedTasks = room.tasks.filter(t => t.id !== taskId);
      
      // Update the room with the filtered tasks array
      await supabaseRoomService.update(roomId, { tasks: updatedTasks });
    } catch (err) {
      console.error('Error deleting task from Supabase:', err);
      throw err;
    }
  }
};

// Data synchronization functions
export const supabaseSyncService = {
  async syncLocalToSupabase(userId: string): Promise<void> {
    // Import the local DB service to get local data
    const { db, houseService, roomService } = await import('./db');
    
    try {
      console.log('Starting synchronization from local to Supabase');
      
      // Get all houses for the user from the local database
      const localHouses = await houseService.getAllForUser(userId);
      
      for (const house of localHouses) {
        console.log(`Syncing house ${house.id}`);
        
        // Check if the house already exists in Supabase
        const existingHouse = await supabaseHouseService.getById(house.id);
        
        if (existingHouse) {
          // Update existing house
          await supabaseHouseService.update(house.id, {
            name: house.name,
            address: house.address,
            photo: house.photo
          });
        } else {
          // Create new house (keeping same ID for consistency)
          const { id, ...houseData } = house;
          await supabase.from('houses').insert({ ...house });
        }
        
        // Sync rooms for this house
        const localRooms = await roomService.getAllForHouse(house.id);
        
        for (const room of localRooms) {
          console.log(`Syncing room ${room.id}`);
          
          // Check if the room already exists in Supabase
          const existingRoom = await supabaseRoomService.getById(room.id);
          
          if (existingRoom) {
            // Update existing room
            await supabaseRoomService.update(room.id, {
              name: room.name,
              budget: room.budget,
              deadline: room.deadline,
              thumbnail: room.thumbnail,
              photos: room.photos,
              tasks: room.tasks
            });
          } else {
            // Create new room (keeping same ID for consistency)
            const { id, ...roomData } = room;
            await supabase.from('rooms').insert({ ...room });
          }
        }
      }
      
      console.log('Synchronization complete');
    } catch (err) {
      console.error('Error during synchronization:', err);
      throw err;
    }
  }
}; 