import Dexie, { type Table } from 'dexie';
import type { Room, Task, House, User } from '$lib/types';

// Function to delete the database
async function deleteDatabase() {
  try {
    await Dexie.delete('oppuss-db');
    console.log('Database deleted successfully');
  } catch (error) {
    console.error('Error deleting database:', error);
  }
}

export class OppussDatabase extends Dexie {
  houses!: Table<House, string>;
  rooms!: Table<Room, string>;
  users!: Table<User, string>;
  
  constructor() {
    super('oppuss-db');
    
    // Set up database schema
    this.version(4).stores({
      houses: 'id, userId, name, createdAt, updatedAt',
      rooms: 'id, houseId, name, budget, deadline, createdAt, updatedAt',
      users: 'id, email, name, createdAt, updatedAt'
    });

    // Handle version changes
    this.on('versionchange', (event) => {
      const oldVersion = event.oldVersion ?? 0;
      const newVersion = event.newVersion ?? 0;
      
      console.log(`Database version change detected: ${oldVersion} -> ${newVersion}`);
      
      // Only handle version changes when there's an actual upgrade
      if (oldVersion < newVersion) {
        console.log('Database upgrade in progress...');
        
        // Close the database connection to allow the upgrade to proceed
        this.close();
        
        // Only reload if we're in the browser and it's a major version change
        if (typeof window !== 'undefined' && Math.floor(oldVersion) !== Math.floor(newVersion)) {
          console.log('Major version change detected, reloading page...');
          window.location.reload();
        }
      }
    });
  }
}

export const db = new OppussDatabase();

// House operations
export const houseService = {
  async getAll(): Promise<House[]> {
    console.log('DB: Getting all houses');
    const houses = await db.houses.toArray();
    console.log('DB: Retrieved houses:', houses);
    return houses;
  },
  
  async getAllForUser(userId: string): Promise<House[]> {
    console.log('DB: Getting houses for user:', userId);
    const houses = await db.houses.where('userId').equals(userId).toArray();
    console.log('DB: Retrieved houses for user:', houses);
    return houses;
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
  },

  // Add this method to delete all houses for a user when they delete their account
  async deleteAllForUser(userId: string): Promise<void> {
    const userHouses = await this.getAllForUser(userId);
    for (const house of userHouses) {
      await this.delete(house.id);
    }
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

// User operations
export const userService = {
  async getByEmail(email: string): Promise<User | undefined> {
    return await db.users.where('email').equals(email).first();
  },
  
  async register(userData: { email: string; password: string; name: string }): Promise<string> {
    // Check if user already exists
    const existingUser = await this.getByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    
    // In a real application, you should hash the password
    // For simplicity, we're storing it directly, but this is NOT secure
    // TODO: Implement proper password hashing
    const newUser: User = {
      id,
      email: userData.email,
      password: userData.password, // Should be hashed in production
      name: userData.name,
      createdAt: now,
      updatedAt: now
    };
    
    await db.users.add(newUser);
    return id;
  },
  
  async login(email: string, password: string): Promise<User | null> {
    const user = await this.getByEmail(email);
    
    if (!user) {
      return null; // User not found
    }
    
    // In a real app, you would compare hashed passwords
    // This is simplified for demo purposes
    if (user.password !== password) {
      return null; // Password doesn't match
    }
    
    return user;
  },
  
  async deleteUser(userId: string): Promise<void> {
    try {
      console.log(`Attempting to delete user with ID: ${userId}`);
      
      // First check if user exists
      const user = await db.users.get(userId);
      if (!user) {
        console.error(`User with ID ${userId} not found`);
        throw new Error('Bruker ikke funnet');
      }
      
      // Delete all houses (and their rooms) belonging to the user
      await houseService.deleteAllForUser(userId);
      
      // Delete the user
      await db.users.delete(userId);
      console.log(`User ${userId} deleted successfully`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }
}; 