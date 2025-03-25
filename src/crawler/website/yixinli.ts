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
    const maxPages = 3;
    let curPage = 1;
    try {
      const listPage = await browser.newPage();
      const curUrl = baseUrl + `page=${curPage}`;
      console.log(`Click to ${curPage}`);
      await listPage.goto(curUrl, { waitUntil: 'domcontentloaded' });
      await listPage.waitForSelector('.page-wrap');
      const curListHtml = await listPage.content();
      const links = await this.parsePageList(curListHtml);
      await Promise.all(links.map(async (link: { link: string }) => {
        // 慢点
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        console.log(`Click to ${link}`);
        const detailPage = await browser.newPage();
        await detailPage.goto(link.link, {
          waitUntil: 'domcontentloaded',
        });
        await detailPage.waitForSelector('.yxl-editor-article');
        const detailHtml = await detailPage.content();
        const detail = await this.parseDetail(detailHtml);
        result.push({
          ...detail,
        });
        await detailPage.close();
      }));
      let nextPageBtn = await listPage.$('.next');
      while (nextPageBtn != null && curPage < maxPages) {
        // 随机延迟
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));
        console.log(`Click to ${curPage}`);
        await nextPageBtn.click();
        await listPage.waitForSelector('.page-wrap');
        const nextListHtml = await listPage.content();
        const nextLinks = await this.parsePageList(nextListHtml);
        await Promise.all(nextLinks.map(async (link: { link: string }) => {
          const detailPage = await browser.newPage();
          await detailPage.goto(link.link, {
            waitUntil: 'networkidle2',
          });
          await detailPage.waitForSelector('.yxl-editor-article');
          const detailHtml = await detailPage.content();
          const detail = await this.parseDetail(detailHtml);
          result.push({
            ...detail,
          });
        }));
        nextPageBtn = await listPage.$('.next');
        curPage++;
      }
    } catch (error) {
      console.error(error);
    } finally {
      await browser.close();
    }
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
  private async parsePageList(html: string): Promise<any> {
    const $ = cheerio.load(html);
    return $('#articleListM').find('.title').map((index, element) => {
      return {
        link: $(element).attr('href')
      };
    }).get();
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