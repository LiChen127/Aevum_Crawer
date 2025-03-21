import axios from "axios";
import * as cheerio from "cheerio";
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { prisma } from './prisma.service.ts';
import pLimit from 'p-limit';
import { CrawlerConfig } from "../types/crawler.interface.ts";

// 开启
// 隐身
const puppeteerBrowser = puppeteerExtra.use(StealthPlugin());

class CrawlerService {
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
  public async crwalDynamic(url: string): Promise<string> {
    // console.log("url", url);
    const browser = await puppeteerBrowser.launch({
      headless: true, // 开启无头浏览器模式
      // args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log("Browser launch", browser);
    try {
      const page = await browser.newPage();
      console.log("Page: \n", page);
      await page.goto(url, { waitUntil: 'networkidle0' });
      const content = await page.content();
      // console.log("Content: \n", content);
      return content;
    } catch (error) {
      console.log("Error: \n", error);
      // console.error(error);
      return String(error);
    } finally {
      console.log("Browser close");
      await browser.close();
    }
  }

  // 解析内容
  private async parseContent(html: string, url: string): Promise<any> {
    const $ = cheerio.load(html);
    return {
      title: $('.title').text(),
      tags: $('.first-tag').find('a').map((i, el) => $(el).text()).get(),
      publishTime: $('.info').find('span').first().text(),
      articleCover: $('.article-body-m').find('.cover-con').find('img').attr('src'),
      articleBody: $('.article-body-m').find('.yxl-editor-article').find('p').map((i, el) => $(el).text()).get()
    };
  }

  // 处理单个URL
  async processUrl(taskId: number, url: string, isDynamic: boolean = false): Promise<void> {
    try {
      // 更新，将该任务设置为running
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
      // 解析内容
      const parsedContent = await this.parseContent(html, url);
      // 保存结果
      await prisma.result.create({
        data: {
          taskId,
          data: parsedContent,
        },
      });
      // 更新任务状态为已完成
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
  /**
   * 解析列表获取跳转到详情页的url links
   * @param html 
   * @returns 
   */
  public async parseListPage(html: string): Promise<string[]> {
    const $ = cheerio.load(html);
    const links: string[] = [];
    // articleListM 下面的item标签就是每篇文章的预览内容
    $('.articleListM .item').each((_, element) => {
      const link = $(element).find('.title a').attr('href');
      if (link) {
        links.push(link);
      }
    });
    return links;
  }

  // 处理分页
  public async getNextPageUrl($: cheerio.CheerioAPI, currentPage: number): Promise<string | null> {
    const hasNextPage = $(`.ant-pagination-item-${currentPage + 1}`).length > 0;
    if (hasNextPage) {
      return `https://www.xinli001.com/info/work?page=${currentPage + 1}`;
    }
    return null;
  }
}

export default CrawlerService;