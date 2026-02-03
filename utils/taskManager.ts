// Enhanced Task Management Utilities
import { Task, TaskStatus } from '../types';

export class TaskManager {
  static generateTempId(): string {
    return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static createOptimisticTask(task: Task, tempId: string): Task {
    return { ...task, id: tempId };
  }

  static prepareTaskPayload(task: Task): any {
    return {
      title: task.title,
      description: task.description,
      status: task.status === TaskStatus.TODO ? 'todo' : 
              task.status === TaskStatus.IN_PROGRESS ? 'in_progress' : 'completed',
      priority: task.priority.toLowerCase(),
      due_date: task.dueDate,
      project_id: task.projectId ? parseInt(task.projectId) : undefined
    };
  }

  static updateTaskWithResponse(optimisticTasks: Task[], tempId: string, serverTask: any): Task[] {
    return optimisticTasks.map(t => 
      t.id === tempId 
        ? { ...t, id: serverTask.id.toString(), ...serverTask } 
        : t
    );
  }

  static handleError(tasks: Task[], tempId: string, error: any): { updatedTasks: Task[], errorMessage: string } {
    const updatedTasks = tasks.filter(t => t.id !== tempId);
    const errorMessage = error.message || 'Failed to create task';
    return { updatedTasks, errorMessage };
  }

  static createSuccessMessage(taskTitle: string): string {
    return `✅ Task "${taskTitle}" created successfully`;
  }

  static createErrorMessage(error: string): string {
    return `❌ Error: ${error}`;
  }
}