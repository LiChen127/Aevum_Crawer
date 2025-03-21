import axios from "axios";
import * as cheerio from "cheerio";
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { prisma } from './prisma.service.ts';
import pLimit from 'p-limit';
import { CrawlerConfig } from "../types/crawler.interface.ts";

// 开启
const puppeteerBrowser = puppeteerExtra.use(StealthPlugin());

export class CrawlerService {
  private config: CrawlerConfig;

  private limiter: ReturnType<typeof pLimit>;

  constructor(config: CrawlerConfig) {
    this.config = config;
    this.limiter = pLimit(config.concurrency);
  }

  // 爬取静态页面
  private async crawlStatic(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: this.config.headers,
      timeout: this.config.timeout,
    });
    return response.data;
  }

  // 动态页面爬取
  private async crwalDynamic(url: string): Promise<string> {
    const browser = await puppeteerBrowser.launch({
      headless: true,
    });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });
      const content = await page.content();
      return content;
    } catch (error) {
      console.error(error);
      return String(error);
    } finally {
      await browser.close();
    }
  }

  // 解析内容
  private async parseContent(html: string, url: string): Promise<any> {
    const $ = cheerio.load(html);
    const result = {
      // 标题
      title: $('title').text(),
      // 内容
      content: $('article').find($('.card-left-content-detail')).text(),
    };
    return result;
  }

  // 处理单个URL
  async processUrl(taskId: number, url: string, isDynamic: boolean = false): Promise<void> {
    try {
      await prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          status: 'running',
        },
      });
      // 爬取内容
      const html = isDynamic ? await this.crwalDynamic(url) : await this.crawlStatic(url);
      // console.log("Get HTML \n", html);
      // 解析内容
      const parsedContent = await this.parseContent(html, url);
      console.log("ParsedContent: \n", parsedContent);
      // 保存结果
      await prisma.result.create({
        data: {
          taskId,
          data: parsedContent,
        },
      });
      // 更新任务状态
      await prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          status: "completed"
        }
      });
    } catch (error) {
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: 'failed',
          error: String(error),
          retryCount: { increment: 1 }
        }
      });
    }
  }
}