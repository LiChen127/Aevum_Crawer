import Bull from "bull";
import { taskDataConfig } from "./type.ts";

/**
 * 利用bull生成全局工作流控制的工作队列
 */
class CrawlerQueue {
  private crawlerQueue: Bull.Queue;

  constructor() {
    this.crawlerQueue = new Bull("crawler", {
      redis: {
        host: "127.0.0.1",
        port: 6379,
      },
    });
  }
  /**
   * 添加任务
   * @param taskData 
   */
  public async addTask(taskData: taskDataConfig): Promise<void> {
    await this.crawlerQueue.add(taskData);
  }

  /**
   * 根据id处理任务
   */
  public async processTask(id: string): Promise<void> {
    await this.crawlerQueue.process(id, async (job, done) => {
      const { taskId, url, isDynamic, crawler } = job.data;
      const crawlerInstance = new crawler(taskId, url, isDynamic);
      await crawlerInstance.crawl();
      done();
    });
  }
}

export default new CrawlerQueue();