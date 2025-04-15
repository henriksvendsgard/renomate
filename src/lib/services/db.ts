import Dexie, { type Table } from 'dexie';
import type { Room, Task } from '$lib/types';

export class OppussDatabase extends Dexie {
  rooms!: Table<Room, string>;
  
  constructor() {
    super('oppuss-db');
    this.version(1).stores({
      rooms: 'id, name, budget, deadline, createdAt, updatedAt'
      // We don't need to define tasks table separately as they are stored within rooms
    });
  }
}

export const db = new OppussDatabase();

// Room operations
export const roomService = {
  async getAll(): Promise<Room[]> {
    return await db.rooms.toArray();
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
    
    const updatedTasks = [...room.tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      ...updates,
      updatedAt: now
    };
    
    await db.rooms.update(roomId, {
      tasks: updatedTasks,
      updatedAt: now
    });
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