import puppeteer from 'puppeteer';
import { CrawlerConfig } from '../../types/crawler.interface.ts';

class DynamicCrawler {
  private config: CrawlerConfig;

  constructor(config: CrawlerConfig) {
    this.config = config;
  }
  async crawlDynamic(url: string) {
    const browser = await puppeteer.launch({
      headless: true, // 无头模式
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // await page.setUserAgent(this.config.userAgent);
    const UA = this.config.headers?.userAgent ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36';
    // await page.setUserAgent(this.config.headers.userAgent);
    await page.setUserAgent(UA);
    // 拦截静态资源提升速度
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.goto(url, {
      waitUntil: 'networkidle2', // 等待网络空闲
      timeout: 60000,
    });

    // 处理分页点击（示例）
    while (true) {
      const content = await page.content();
      // 处理当前页内容...

      const nextBtn = await page.$('.pagination-next');
      if (!nextBtn) break;

      await Promise.all([
        page.click('.pagination-next'),
        page.waitForNavigation({ waitUntil: 'networkidle2' })
      ]);
    }

    await browser.close();
  }
}