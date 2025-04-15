import Dexie, { type Table } from 'dexie';
import type { Room, Task, House } from '$lib/types';

export class OppussDatabase extends Dexie {
  houses!: Table<House, string>;
  rooms!: Table<Room, string>;
  
  constructor() {
    super('oppuss-db');
    this.version(2).stores({
      houses: 'id, name, createdAt, updatedAt',
      rooms: 'id, houseId, name, budget, deadline, createdAt, updatedAt'
    });
  }
}

export const db = new OppussDatabase();

// House operations
export const houseService = {
  async getAll(): Promise<House[]> {
    return await db.houses.toArray();
  },
  
  async getById(id: string): Promise<House | undefined> {
    return await db.houses.get(id);
  },
  
  async add(house: Omit<House, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const newHouse: House = {
      ...house,
      id,
      createdAt: now,
      updatedAt: now
    };
    await db.houses.add(newHouse);
    return id;
  },
  
  async update(id: string, updates: Partial<Omit<House, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const now = new Date().toISOString();
    await db.houses.update(id, { ...updates, updatedAt: now });
  },
  
  async delete(id: string): Promise<void> {
    // First, get all rooms for this house
    const rooms = await db.rooms.where('houseId').equals(id).toArray();
    
    // Delete all rooms
    for (const room of rooms) {
      await roomService.delete(room.id);
    }
    
    // Delete the house
    await db.houses.delete(id);
  }
};

// Room operations
export const roomService = {
  async getAll(): Promise<Room[]> {
    return await db.rooms.toArray();
  },
  
  async getAllForHouse(houseId: string): Promise<Room[]> {
    return await db.rooms.where('houseId').equals(houseId).toArray();
  },
  
  async getById(id: string): Promise<Room | undefined> {
    return await db.rooms.get(id);
  },
  
  async add(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const newRoom: Room = {
      ...room,
      id,
      createdAt: now,
      updatedAt: now,
      tasks: room.tasks || []
    };
    await db.rooms.add(newRoom);
    return id;
  },
  
  async update(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const now = new Date().toISOString();
    
    try {
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
      
      // Perform the update
      await db.rooms.update(id, { ...updates, updatedAt: now });
      console.log('Room updated successfully in DB');
    } catch (error) {
      console.error('Error in room update:', error);
      throw error;
    }
  },
  
  async delete(id: string): Promise<void> {
    await db.rooms.delete(id);
  }
};

// Task operations within rooms
export const taskService = {
  async addTask(roomId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
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
    
    await db.rooms.update(roomId, {
      tasks: [...room.tasks, newTask],
      updatedAt: now
    });
    
    return id;
  },
  
  async updateTask(roomId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const room = await roomService.getById(roomId);
    if (!room) throw new Error('Room not found');
    
    const now = new Date().toISOString();
    const taskIndex = room.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) throw new Error('Task not found');
    
    console.debug(`Updating task ${taskId} in room ${roomId}:`, updates);
    
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
    
    await db.rooms.update(roomId, {
      tasks: updatedTasks,
      updatedAt: now
    });
    
    console.debug(`Task ${taskId} updated in database`);
  },
  
  async deleteTask(roomId: string, taskId: string): Promise<void> {
    const room = await roomService.getById(roomId);
    if (!room) throw new Error('Room not found');
    
    const now = new Date().toISOString();
    const updatedTasks = room.tasks.filter(t => t.id !== taskId);
    
    await db.rooms.update(roomId, {
      tasks: updatedTasks,
      updatedAt: now
    });
  }
}; 