import Queue from "bull";
import { CrawlerService } from "./crawler.service.ts";
import { prisma } from "./prisma.service.ts";

export class QueueService {
  private crawlerService: CrawlerService;
  private crawlerQueue: Queue.Queue;

  constructor() {
    this.crawlerQueue = new Queue("crawler-queue", {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    });

    this.crawlerService = new CrawlerService({
      concurrency: 3, // 并发数
      retryTimes: 5,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
      }
    });

    this.initializeQueu();
  }

  private initializeQueu() {
    this.crawlerQueue.process(async (job) => {
      const { taskId, url, isDynamic } = job.data;
      await this.crawlerService.processUrl(taskId, url, isDynamic);
    });

    this.crawlerQueue.on("failed", async (job, err) => {
      const { taskId } = job.data;
      await prisma
        .task.update({
          where: {
            id: taskId
          },
          data: {
            status: "failed",
            error: err.message,
            updatedAt: new Date()
          }
        });
    });
  }

  // 添加任务
  async addTask(taskId: number, url: string, isDynamic: boolean = false) {
    await this.crawlerQueue.add({
      taskId,
      url,
      isDynamic
    }, {
      attempts: 3, // 重试次数
      backoff: {
        type: "exponential", // 指数退避
        delay: 2000 // 延迟时间
      }
    });
  }
}