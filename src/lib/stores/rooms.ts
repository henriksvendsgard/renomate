import { writable, derived } from 'svelte/store';
import type { Room, Task, House } from '$lib/types';
import { roomService, houseService, taskService } from '$lib/services/dbService';
import { browser } from '$app/environment';

// Initialize with empty arrays
const initialHouses: House[] = [];
const initialRooms: Room[] = [];

function createHousesStore() {
  const { subscribe, set } = writable<House[]>(initialHouses);

  return {
    subscribe,
    
    // Load houses from the database for the current user
    async load() {
      if (browser) {
        console.log('Houses store: Loading houses for current user');
        try {
          // Since we simplified the service, getAll() already filters by current user
          const houses = await houseService.getAll();
          console.log('Houses store: Loaded houses:', houses);
          set(houses);
        } catch (error) {
          console.error('Houses store: Error loading houses:', error);
          // Set empty array on error to avoid stuck loading state
          set([]);
          throw error;
        }
      }
    },
    
    // Add a new house
    async add(house: { name: string; address?: string; photo?: string }) {
      if (browser) {
        const id = await houseService.add(house);
        await this.load();
        return id;
      }
    },
    
    // Update a house
    async update(id: string, updates: Partial<Omit<House, 'id' | 'createdAt' | 'updatedAt'>>) {
      if (browser) {
        await houseService.update(id, updates);
        await this.load();
      }
    },
    
    // Delete a house and all its rooms
    async delete(id: string) {
      if (browser) {
        await houseService.delete(id);
        await this.load();
        await rooms.load(); // Reload rooms as well
      }
    }
  };
}

function createRoomsStore() {
  const { subscribe, set, update } = writable<Room[]>(initialRooms);

  return {
    subscribe,
    
    // Load rooms from the database for the current user's houses
    async load() {
      if (browser) {
        // Get all houses for the current user
        const userHouses = await houseService.getAll();
        // Get all rooms for those houses
        const rooms = [];
        for (const house of userHouses) {
          const houseRooms = await roomService.getAllForHouse(house.id);
          rooms.push(...houseRooms);
        }
        set(rooms);
      }
    },
    
    // Load rooms for a specific house
    async loadForHouse(houseId: string) {
      if (browser) {
        const rooms = await roomService.getAllForHouse(houseId);
        set(rooms);
      }
    },
    
    // Add a new room
    async add(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) {
      if (browser) {
        const id = await roomService.add({ ...room, tasks: [] });
        await this.load();
        return id;
      }
    },
    
    // Update a room
    async updateRoom(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>) {
      if (browser) {
        try {
          if (updates.photos) {
            console.log('Updating room photos:', 
              updates.photos ? `${updates.photos.length} photos` : 'no photos'
            );
          }
          
          update(rooms => {
            return rooms.map(room => {
              if (room.id === id) {
                return {
                  ...room,
                  ...updates,
                  updatedAt: new Date().toISOString()
                };
              }
              return room;
            });
          });
          
          await roomService.update(id, updates);
          await this.load();
        } catch (error) {
          console.error('Error updating room:', error);
          await this.load();
          throw error;
        }
      }
    },
    
    // Delete a room
    async deleteRoom(id: string) {
      if (browser) {
        await roomService.delete(id);
        update(rooms => rooms.filter(room => room.id !== id));
      }
    },
    
    // Add a task to a room
    async addTask(roomId: string, task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
      if (browser) {
        const tempId = crypto.randomUUID();
        const now = new Date().toISOString();
        const newTask: Task = {
          ...task,
          id: tempId,
          createdAt: now,
          updatedAt: now
        };
        
        update(rooms => {
          return rooms.map(room => 
            room.id === roomId 
              ? { ...room, tasks: [...room.tasks, newTask], updatedAt: now } 
              : room
          );
        });
        
        try {
          const taskId = await taskService.addTask(roomId, task);
          
          update(rooms => {
            return rooms.map(room => 
              room.id === roomId 
                ? { 
                    ...room, 
                    tasks: room.tasks.map(t => 
                      t.id === tempId ? { ...t, id: taskId } : t
                    )
                  } 
                : room
            );
          });
          
          return taskId;
        } catch (error) {
          console.error('Failed to add task:', error);
          update(rooms => {
            return rooms.map(room => 
              room.id === roomId 
                ? { ...room, tasks: room.tasks.filter(t => t.id !== tempId) } 
                : room
            );
          });
          throw error;
        }
      }
    },
    
    // Update a task in a room
    async updateTask(roomId: string, taskId: string, updates: Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>) {
      if (browser) {
        const now = new Date().toISOString();
        
        update(rooms => {
          return rooms.map(room => 
            room.id === roomId 
              ? { 
                  ...room, 
                  updatedAt: now,
                  tasks: room.tasks.map(task => 
                    task.id === taskId 
                      ? { ...task, ...updates, updatedAt: now } 
                      : task
                  )
                } 
              : room
          );
        });
        
        try {
          await taskService.updateTask(roomId, taskId, updates);
        } catch (error) {
          console.error('Failed to update task:', error);
          await this.load();
          throw error;
        }
      }
    },
    
    // Delete a task from a room
    async deleteTask(roomId: string, taskId: string) {
      if (browser) {
        let deletedTask: Task | undefined;
        
        update(rooms => {
          const room = rooms.find(r => r.id === roomId);
          if (room) {
            deletedTask = room.tasks.find(t => t.id === taskId);
          }
          
          return rooms.map(room => 
            room.id === roomId 
              ? { 
                  ...room, 
                  updatedAt: new Date().toISOString(),
                  tasks: room.tasks.filter(task => task.id !== taskId) 
                } 
              : room
          );
        });
        
        try {
          await taskService.deleteTask(roomId, taskId);
        } catch (error) {
          console.error('Failed to delete task:', error);
          
          if (deletedTask) {
            update(rooms => {
              return rooms.map(room => 
                room.id === roomId 
                  ? { ...room, tasks: [...room.tasks, deletedTask!] } 
                  : room
              );
            });
          }
          
          throw error;
        }
      }
    },
    
    // Toggle task completion status
    async toggleTaskCompletion(roomId: string, taskId: string) {
      if (browser) {
        let newDoneState = false;
        let taskCost = 0;
        console.debug(`Toggling completion for task ${taskId} in room ${roomId}`);
        
        update(rooms => {
          const room = rooms.find(r => r.id === roomId);
          if (room) {
            const task = room.tasks.find(t => t.id === taskId);
            if (task) {
              newDoneState = !task.done;
              taskCost = task.cost || 0;
              console.debug(`Task ${taskId}: changing done state from ${task.done} to ${newDoneState}, cost: ${taskCost}`);
              
              return rooms.map(r => 
                r.id === roomId 
                  ? {
                      ...r,
                      updatedAt: new Date().toISOString(),
                      tasks: r.tasks.map(t => 
                        t.id === taskId ? { ...t, done: newDoneState, updatedAt: new Date().toISOString() } : t
                      )
                    }
                  : r
              );
            }
          }
          return rooms;
        });
        
        try {
          await taskService.updateTask(roomId, taskId, { done: newDoneState });
          console.debug(`Task ${taskId} completion state updated in database. Will affect total by ${newDoneState ? '+' : '-'}${taskCost}`);
        } catch (error) {
          console.error('Failed to toggle task completion:', error);
          await this.load();
          throw error;
        }
      }
    }
  };
}

export const houses = createHousesStore();
export const rooms = createRoomsStore();

// Derived store for total budget across all rooms in a house
export const getHouseBudget = (houseId: string) => derived(rooms, $rooms => {
  return $rooms
    .filter(room => room.houseId === houseId)
    .reduce((sum, room) => sum + room.budget, 0);
});

// Derived store for spent amount in a house
export const getHouseSpent = (houseId: string) => derived(rooms, ($rooms) => {
  console.debug(`Recalculating total spent for house ${houseId}`);
  const total = $rooms
    .filter(room => room.houseId === houseId)
    .reduce((total, room) => {
      console.debug(`Calculating spent for room ${room.id} (${room.name})`);
      const roomTotal = room.tasks
        .filter(task => {
          const isDone = task.done === true;
          const cost = Number(task.cost) || 0;
          console.debug(`Task ${task.id}: done=${isDone}, cost=${cost}, will ${isDone ? 'include' : 'exclude'} in total`);
          return isDone;
        })
        .reduce((sum, task) => {
          const cost = Number(task.cost) || 0;
          return sum + cost;
        }, 0);
      
      console.debug(`Room ${room.id} total spent: ${roomTotal}`);
      return total + roomTotal;
    }, 0);
  
  console.debug('Final total spent:', total);
  return total;
});

// Derived store for remaining budget in a house
export const getHouseRemaining = (houseId: string) => derived(
  [getHouseBudget(houseId), getHouseSpent(houseId)], 
  ([$houseBudget, $houseSpent]) => {
    return $houseBudget - $houseSpent;
  }
); 