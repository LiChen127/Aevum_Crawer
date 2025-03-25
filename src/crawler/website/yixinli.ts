import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';


class YixinliCrawler {
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
    const testUrl = "https://www.xinli001.com/info?page=1";
    const browser = await puppeteer.launch({
      headless: false,
    });
    try {
      const page = await browser.newPage();
      await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
      const html = await page.evaluate(() => {
        return document.documentElement.outerHTML;
      });
      console.log(html, "html");
      const links = await this.parsePageList(html);
      console.log(links);
      return links;
    } catch (error) {
      console.error(error);
    } finally {
      await browser.close();
    }
  }

  /**
   * 解析分页数据获取link
   */
  private async parsePageList(html: string): Promise<any> {
    const $ = cheerio.load(html);
    return $('#articleListM').find('.title').map((index, element) => {
      return {
        link: $(element).attr('href')
      };
    }).get();
  }
}

export default new YixinliCrawler();