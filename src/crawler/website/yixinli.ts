import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import PQueue from 'p-queue';
import { getRandomUserAgent, hideAutomation, randomDelay } from '../../utils/crawlerUtls.ts';


type detail = {
  title: string;
  content: string;
}

class YixinliCrawler {
  private handleQueue = new PQueue({
    concurrency: 5,
    timeout: 30000,
  });
  // private url 
  public async crawAllTags(): Promise<any> {
    const url = "https://www.xinli001.com/info?source=pc-home";
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      // 代理ip
      // devtools: true,
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.page-wrap');
      const html = await page.evaluate(() => {
        return document.documentElement.outerHTML;
      });
      const result = await this.parseTag(html);
      return result;
    } catch (error) {
      console.log('Error: \n', error);
    } finally {
      await browser.close();
    }
  }

  private async parseTag(html: string): Promise<any> {
    const $ = cheerio.load(html);
    return $('.first-tag').find('a').map((index, element) => {
      return {
        tag: $(element).text(),
        link: $(element).attr('href')
      };
    }).get();
  }

  /**
   * 爬取分页具体文章
   * https://www.xinli001.com/info?page=4
   */
  public async crawlPageList(): Promise<any> {
    const testUrl = "https://www.xinli001.com/info?page=2";
    const browser = await puppeteer.launch({
      headless: false,
    });
    try {
      const page = await browser.newPage();
      await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.page-wrap');
      const html = await page.evaluate(() => {
        return document.documentElement.outerHTML;
      });
      const links = await this.parsePageList(html);
      return links;
    } catch (error) {
      console.error(error);
    } finally {
      await browser.close();
    }
  }

  public async crawlList(): Promise<any> {
    const baseUrl = "https://www.xinli001.com/info?";
    const browser = await puppeteer.launch({
      headless: false,
    });
    const result: any[] = [];
    // const maxPages = 1;
    const curPage = 1;

    try {
      const listPage = await browser.newPage();

      await listPage.setUserAgent(getRandomUserAgent());
      await listPage.setJavaScriptEnabled(true);
      await hideAutomation(browser, listPage);

      const curListUrl = baseUrl + `page=${curPage}`;
      await listPage.goto(curListUrl, { waitUntil: 'networkidle2' });

      const linkItems = this.parsePageList(await listPage.content());
      if (linkItems == null) {
        console.log(`${curPage} page error`);
        return;
      }
      const detailResult = await this.processDetailPages(browser, linkItems);
      if (detailResult == null) {
        console.log(`${curPage} page error`);
        return;
      }
      console.log(detailResult);
      result.push(...detailResult);
      // let nextBtn = await listPage.$('.next');

      // while (nextBtn !== null && curPage <= maxPages) {
      //   console.log(`${curPage} page error`);
      //   randomDelay(1000, 3000);
      //   const newListUrl = baseUrl + `page=${curPage}`;
      //   await listPage.goto(newListUrl, { waitUntil: 'networkidle2' });
      //   const linkItems = this.parsePageList(await listPage.content());
      //   if (!linkItems) {
      //     console.log(`${curPage} page error`);
      //     break;
      //   }
      //   const detail = await this.processDetailPages(browser, linkItems);
      //   if (detail !== null) {
      //     result.push(detail);
      //   }
      //   nextBtn = await listPage.$('.next');
      //   curPage++;
      // }
    } catch (error) {
      console.error("main list crawlering error: ", error);
    } finally {
      try {
        await browser.close();
        console.log('Crawler End');
      } catch (error) {
        console.log(error);
      }
    }
    return result;
  }

  private async processDetailPages(browser: puppeteer.Browser, linkItems: { link: string }[]) {

    let detail: detail;
    const result: detail[] = [];
    await this.handleQueue.addAll(linkItems.map(link => async () => {
      try {
        await randomDelay(500, 1500);
        const detailPage = await browser.newPage();
        await hideAutomation(browser, detailPage);
        await detailPage.goto(link.link, {
          waitUntil: 'domcontentloaded',
        });
        await detailPage.waitForSelector(".yxl-editor-article", { visible: true });

        detail = await this.parseDetail(await detailPage.content());
        result.push({
          ...detail,
        });
        await detailPage.close();
        return detail;
      } catch (error) {
        console.log(error);
      }
    }));
    return result;
  }

  /**
   * 爬取文章详情
   */
  public async crawlDetail(): Promise<any> {
    const testUrl = "https://www.xinli001.com/info/100498839";
    const browser = await puppeteer.launch({
      headless: false,
    });
    try {
      const page = await browser.newPage();
      page.on("error", err => {
        console.error("Page error: ", err);
      });
      await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.yxl-editor-article');
      //   await new Promise<void>((resolve, reject) => {
      //     let totalHeight = 0;
      //     const scrollStep = 100;
      //     const scrollInterval = 500;  // 增加间隔时间
      //     const timer = setInterval(() => {
      //       const scrollHeight = document.body.scrollHeight;
      //       window.scrollBy(0, scrollStep);
      //       totalHeight += scrollStep;
      //       if (totalHeight >= scrollHeight) {
      //         clearInterval(timer);
      //         resolve();
      //       }
      //     }, scrollInterval);
      //     // 添加安全阀
      //     setTimeout(() => {
      //       clearInterval(timer);
      //       reject(new Error('Scroll timeout after 30 seconds'));
      //     }, 30000);
      //   });
      // });
      const html = await page.content();
      const result = await this.parseDetail(html);
      return result;
    } catch (error) {
      console.error(error);
    } finally {
      await browser.close();
    }
  }

  /**
   * 解析分页数据获取link
   */
  private parsePageList(html: string): { link: string }[] | null {
    const $ = cheerio.load(html);
    const res = $('#articleListM').find('.title').map((index, element) => {
      const href = $(element).attr('href');
      if (element && href) {
        return {
          link: href
        };
      }
    }).get().filter((item): item is { link: string } => item !== undefined && item.link !== undefined);
    if (res.length === 0) {
      return null;
    }
    return res;
  }

  /**
   * 获取文章详情页面
   */
  private async parseDetail(html: string): Promise<any> {
    const $ = cheerio.load(html);
    const title = $('.top').find('h1').text();
    const infoContent = $(".article-body-m").find(".yxl-editor-article").text();
    return { title, infoContent };
  }
}

export default new YixinliCrawler();