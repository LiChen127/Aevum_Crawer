import { prisma } from './prisma.service';
import { Task } from '@prisma/client';

export class TaskService {
  async createTask(url: string, priority: number = 0): Promise<Task> {
    return prisma.task.create({
      data: {
        url,
        priority,
        status: 'pending'
      }
    });
  }

  async updateTaskStatus(id: number, status: string, error?: string): Promise<Task> {
    return prisma.task.update({
      where: { id },
      data: {
        status,
        error,
        updatedAt: new Date()
      }
    });
  }

  async saveResult(taskId: number, data: any): Promise<void> {
    await prisma.result.create({
      data: {
        taskId,
        data
      }
    });

    await this.updateTaskStatus(taskId, 'completed');
  }
}