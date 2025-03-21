import { prisma } from './prisma.service.ts';
import { Task } from '@prisma/client';
import { QueueService } from './queue.service.ts';

class TaskService {
  private queueService: QueueService;

  constructor() {
    this.queueService = new QueueService();
  }

  async createTask(url: string, priority: number = 0, isDynamic: boolean = false): Promise<Task> {
    const tasks = await prisma.task.create({
      data: {
        url,
        priority,
        status: 'pending'
      }
    });
    await this.queueService.addTask(tasks.id, url, isDynamic);
    return tasks;
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

export default new TaskService();