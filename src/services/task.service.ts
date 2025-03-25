import { prisma } from './prisma.service.ts';
import { Task } from '@prisma/client';
import { QueueService } from './queue.service.ts';

class TaskService {
  private queueService: QueueService;

  constructor() {
    this.queueService = new QueueService();
  }
  /**
   * 创建一个爬虫任务
   * @param url 目标url
   * @param priority 优先级
   * @param isDynamic 是否动态爬取
   * @returns 
   */
  async createTask(url: string, priority: number = 0, isDynamic: boolean = false): Promise<Task> {
    // 首先在db中创建一个任务
    const tasks = await prisma.task.create({
      data: {
        url,
        priority,
        status: 'pending'
      }
    });
    // 然后开启队列服务，将任务添加到队列中
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