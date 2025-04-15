import { writable, derived } from 'svelte/store';
import type { Room, Task } from '$lib/types';
import { roomService, taskService } from '$lib/services/db';
import { browser } from '$app/environment';

// Initialize with empty array
const initialRooms: Room[] = [];

function createRoomsStore() {
  const { subscribe, set, update } = writable<Room[]>(initialRooms);

  return {
    subscribe,
    
    // Load rooms from the database
    async load() {
      if (browser) {
        const rooms = await roomService.getAll();
        set(rooms);
      }
    },
    
    // Add a new room
    async add(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>) {
      if (browser) {
        const id = await roomService.add({ ...room, tasks: [] });
        // Reload rooms to ensure we have the most up-to-date data
        await this.load();
        return id;
      }
    },
    
    // Update a room
    async updateRoom(id: string, updates: Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'tasks'>>) {
      if (browser) {
        try {
          // If updating photos, log the data for debugging
          if (updates.photos) {
            console.log('Updating room photos:', 
              updates.photos ? `${updates.photos.length} photos` : 'no photos'
            );
          }
          
          // Perform optimistic UI update first
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
          
          // Then update in the database
          await roomService.update(id, updates);
          
          // Reload to ensure consistency
          await this.load();
        } catch (error) {
          console.error('Error updating room:', error);
          // Reload to restore correct state
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
        // First generate a temporary ID for optimistic UI update
        const tempId = crypto.randomUUID();
        const now = new Date().toISOString();
        const newTask: Task = {
          ...task,
          id: tempId,
          createdAt: now,
          updatedAt: now
        };
        
        // Update the UI immediately
        update(rooms => {
          return rooms.map(room => 
            room.id === roomId 
              ? { ...room, tasks: [...room.tasks, newTask], updatedAt: now } 
              : room
          );
        });
        
        // Then perform the actual database operation
        try {
          const taskId = await taskService.addTask(roomId, task);
          
          // Update the temporary task with the real ID
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
          // If database operation fails, revert the optimistic update
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
        
        // Update UI optimistically
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
        
        // Then update the database
        try {
          await taskService.updateTask(roomId, taskId, updates);
        } catch (error) {
          console.error('Failed to update task:', error);
          // In case of failure, reload from database to ensure consistency
          await this.load();
          throw error;
        }
      }
    },
    
    // Delete a task from a room
    async deleteTask(roomId: string, taskId: string) {
      if (browser) {
        // Store the task before deleting for potential recovery
        let deletedTask: Task | undefined;
        
        // Update UI optimistically
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
        
        // Then update the database
        try {
          await taskService.deleteTask(roomId, taskId);
        } catch (error) {
          console.error('Failed to delete task:', error);
          
          // Restore the task in the UI if database operation fails
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
        
        // Update UI optimistically
        update(rooms => {
          const room = rooms.find(r => r.id === roomId);
          if (room) {
            const task = room.tasks.find(t => t.id === taskId);
            if (task) {
              newDoneState = !task.done;
              
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
        
        // Then update the database
        try {
          await taskService.updateTask(roomId, taskId, { done: newDoneState });
        } catch (error) {
          console.error('Failed to toggle task completion:', error);
          // In case of failure, reload from database to ensure consistency
          await this.load();
          throw error;
        }
      }
    }
  };
}

export const rooms = createRoomsStore();

// Derived store for total budget across all rooms
export const totalBudget = derived(rooms, $rooms => {
  return $rooms.reduce((sum, room) => sum + room.budget, 0);
});

// Derived store for spent amount (based on task costs)
export const totalSpent = derived(rooms, $rooms => {
  return $rooms.reduce((sum, room) => {
    // Filter to only include completed tasks
    const completedTasks = room.tasks.filter(task => task.done === true);
    
    // Calculate total spent for completed tasks
    const roomSpent = completedTasks.reduce((taskSum, task) => {
      // Ensure task.cost is a number
      const cost = typeof task.cost === 'number' ? task.cost : 0;
      return taskSum + cost;
    }, 0);
    
    // Log for debugging purposes
    console.debug(`Room ${room.id}: ${completedTasks.length} completed tasks of ${room.tasks.length} total, spent: ${roomSpent}`);
    
    return sum + roomSpent;
  }, 0);
});

// Derived store for remaining budget
export const remainingBudget = derived(
  [totalBudget, totalSpent], 
  ([$totalBudget, $totalSpent]) => {
    return $totalBudget - $totalSpent;
  }
); 