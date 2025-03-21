import Queue from "bull";
import CrawlerService from "./crawler.service.ts";
import { prisma } from "./prisma.service.ts";
import * as cheerio from "cheerio";

export class QueueService {
  private crawlerService: CrawlerService;
  private crawlerQueue: Queue.Queue;
  private websiteCrawlerQueue: Queue.Queue; // 新增网站爬虫队列

  constructor() {
    // 初始化单体页面爬虫队列
    this.crawlerQueue = new Queue("crawler-queue", {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    });
    // 初始化网站爬虫队列
    this.websiteCrawlerQueue = new Queue("website-crawler-queue", {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      }
    });
    // 初始化爬虫服务
    this.crawlerService = new CrawlerService({
      concurrency: 3, // 并发数
      retryTimes: 5,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
      }
    });

    this.initializeQueue();
  }

  private initializeQueue() {
    this.crawlerQueue.process(async (job) => {
      const { taskId, url, isDynamic } = job.data;
      await this.crawlerService.processUrl(taskId, url, isDynamic);
    });

    this.websiteCrawlerQueue.process(async (job) => {
      const { startPage } = job.data;
      await this.processWebsiteCrawl(startPage);
    });

    this.crawlerQueue.on("failed", async (job, err) => {
      const { taskId } = job.data;
      await this.handleFailedTask(taskId, err);
    });

    this.websiteCrawlerQueue.on("failed", async (job, err) => {
      const { taskId } = job.data;
      await this.handleFailedTask(taskId, err);
    });
  }

  private async handleFailedTask(taskId: number, error: Error) {
    try {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: "failed",
          error: error.message,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error("Error updating failed task:", error);
    }
  }

  private async processWebsiteCrawl(startPage: number) {
    try {
      let curPage = startPage;
      let hasNextPage = true;

      while (hasNextPage) {
        const listPageTask = await prisma.task.create({
          data: {
            url: `https://www.xinli001.com/info/work?page=${curPage}`,
            priority: 1,
            status: 'pending'
          }
        });

        const listHtml = await this.crawlerService.crwalDynamic(listPageTask.url);
        const articleLinks = await this.crawlerService.parseListPage(listHtml);

        for (const articleUrl of articleLinks) {
          const detailTask = await prisma.task.create({
            data: {
              url: articleUrl,
              status: 'pending'
            }
          });

          await this.addTask(detailTask.id, articleUrl, false);

          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        const $ = cheerio.load(listHtml);
        const nextPageUrl = await this.crawlerService.getNextPageUrl($, curPage);

        if (nextPageUrl) {
          curPage++;
        } else {
          hasNextPage = false;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error in website crawler:", error);
      throw error;
    }
  }

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

  async addWebsiteCrawlerTask(startPage: number = 1) {
    await this.websiteCrawlerQueue.add({
      startPage
    }, {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000
      }
    });
  }
}