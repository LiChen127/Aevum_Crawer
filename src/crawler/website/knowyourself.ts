// Knowyourself website crawler
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";

class KnowyourselfCrawler {
  // 解析该网站的内容标签
  public async parseContentToGetTags(html: string): Promise<any> {
    const $ = cheerio.load(html);
    const tags: string[] = [];
    $('nav').find('h2').each((index, element) => {
      tags.push($(element).text());
    });
    return tags;
  }

  // 获取文章列表的标题+链接
  public async parseListPage(html: string): Promise<{
    title: string;
    link: string;
  }[]> {
    const $ = cheerio.load(html);
    const result: any[] = [];
    $('article').find('.card-item').each((index, element) => {
      const title = $(element).find('.card-item-content').find('h2').text();
      // link就是card-item就是a标签
      const link = element.attribs.href;
      result.push({ title, link });
      // 下一页
    });
    return result;
  }

  public async crawListPage(): Promise<any> {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    const result: any[] = [];
    try {
      // 访问初始页面
      await page.goto('https://www.knowyourself.cc/list?id=hunlianqinggan', {
        waitUntil: 'networkidle2',
      });
      // 爬取第一页
      await page.waitForSelector('.ant-pagination-item', { visible: true });
      const html = await page.evaluate(() => {
        return document.documentElement.outerHTML;
      });
      const list = await this.parseListPage(html);
      // 延迟一下，防止被ban
      await new Promise(resolve => setTimeout(resolve, 100));
      list.map(async (item) => {
        const detailLink = item.link;
        // 开启新的页面
        const detailPage = await browser.newPage();
        await detailPage.goto(`https://www.knowyourself.cc${detailLink}`, {
          waitUntil: 'networkidle2',
        });
        const detailHtml = await detailPage.evaluate(() => {
          return document.documentElement.outerHTML;
        });
        const detail = await this.parseDetail(detailHtml);
        result.push({
          ...detail,
        });
        // 关一下页面
        await detailPage.close();
      });
      // 爬取下一页
      let nextPage = await page.$('.ant-pagination-item:not(.ant-pagination-item-active)');
      let currentPage = 2;
      while (nextPage) {
        console.log(`Clicking next page: ${currentPage}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        await Promise.all([
          nextPage.click(),
        ]);
        await page.waitForSelector('.ant-pagination-item-active');
        const html = await page.evaluate(() => {
          return document.documentElement.outerHTML;
        });
        const list = await this.parseListPage(html);
        list.map(async (item) => {
          const detailLink = item.link;
          // 开启新的页面
          const detailPage = await browser.newPage();
          await detailPage.goto(`https://www.knowyourself.cc${detailLink}`, {
            waitUntil: 'networkidle2',
          });
          const detailHtml = await detailPage.evaluate(() => {
            return document.documentElement.outerHTML;
          });
          const detail = await this.parseDetail(detailHtml);
          result.push({
            ...detail,
          });
          await detailPage.close();
        });
        nextPage = await page.$(`.ant-pagination-item-${currentPage + 1}`);
        currentPage++;
      }
      await page.close();
      return result;
    } catch (error) {
      console.log(error);
    } finally {
      await browser.close();
    }
  }
  // 爬取动态分页内容 利用puppeteer
  public async crawlList(): Promise<any> {
    const browser = await puppeteer.launch({
      headless: false, // 调试时可保持可见
    });
    const page = await browser.newPage();
    const result: any[] = [];
    try {
      // 初始访问列表页
      await page.goto('https://www.knowyourself.cc/list?id=hunlianqinggan', {
        waitUntil: 'networkidle2',
      });

      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForSelector('body', { visible: true });
      let currentPage = 1;
      const maxRetries = 3;
      while (currentPage <= 3) { // 安全限制页数
        // 处理当前页内容
        const html = await page.content();
        const list = await this.parseList(html);
        // 处理详情页（优化并行处理）
        const detailPromises = list.map(async (item) => {
          const detailPage = await browser.newPage();
          try {
            await detailPage.goto(`https://www.knowyourself.cc${item.link}`, {
              waitUntil: 'networkidle2',
            });

            // 滚动加载可能的内容
            await detailPage.evaluate(async () => {
              await new Promise(resolve => {
                let totalHeight = 0;
                const scrollStep = 100;
                const timer = setInterval(() => {
                  const scrollHeight = document.body.scrollHeight;
                  window.scrollBy(0, scrollStep);
                  totalHeight += scrollStep;
                  if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve(null);
                  }
                }, 100);
              });
            });
            const detail = await this.parseDetail(await detailPage.content());
            return detail;
          } finally {
            await detailPage.close();
          }
        });
        const details = await Promise.all(detailPromises);
        result.push(...details.filter(d => d.content));
        const nextPageSelector = `.ant-pagination-item-${currentPage + 1}`;
        const curpageNextBtn = await page.$(nextPageSelector);
        if (curpageNextBtn == null) {
          console.log('No next page btn found, stopping...');
          break;
        }
        // 可靠点击方式
        let retry = 0;
        while (retry < maxRetries) {
          try {
            await Promise.all([
              curpageNextBtn.click(),
              page.waitForNavigation({
                waitUntil: 'domcontentloaded',
                timeout: 60000
              }),
              page.waitForSelector(".card-item", { visible: true })
            ]);
            currentPage++;
            break;
          } catch (err) {
            console.log(`Retry ${retry + 1}/3`);
            console.log(err);
            await new Promise(resolve => setTimeout(resolve, 3000));
            retry++;
          }
        }
        if (retry >= maxRetries) {
          console.log('Max retries reached, stopping');
          break;
        }
        // 随机化操作间隔
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      }
    } finally {
      await browser.close();
    }

    return result;
  }

  // 解析list页面的内容
  public async parseList(html: string) {
    const $ = cheerio.load(html);
    const result: any[] = [];
    // 获取文章列表
    $('.card-item').each((index, element) => {
      const title = $(element).find('.card-item-content').find('h2').text();
      // card-item本身就是a标签
      const link = $(element).attr('href');
      result.push({ title, link });
    });
    return result;
  }

  // 解析detail
  private async parseDetail(html: string) {
    const $ = cheerio.load(html);
    return {
      title: $('.card-left-content-title').text(),
      content: $('.card-left-content-detail').text(),
    };
  }

}

export default new KnowyourselfCrawler();