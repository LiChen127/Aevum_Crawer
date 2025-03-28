// Knowyourself website crawler
import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import tagService from '../../storages/knowyourself/tag.ts';
import contentService from '../../storages/knowyourself/content.ts';

class KnowyourselfCrawler {
  private url = "https://www.knowyourself.cc/";
  // 解析knowyourself的内容标签
  public async crawlerTags(): Promise<any> {
    const browser = await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    try {
      await page.goto(this.url, {
        waitUntil: "networkidle0",
      });
      const html = await page.evaluate(() => {
        return document.documentElement.outerHTML;;
      });
      const result = await this.parseContentToGetTags(html);
      await tagService.batchCreateTag(result);
      return result;
    } catch (error) {
      console.log("Error: \n", error);
    } finally {
      await browser.close();
    }
  }
  // 解析该网站的内容标签
  private async parseContentToGetTags(html: string): Promise<any> {
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

  /**
   * 分页获取文章detail
   * @returns 
   */
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
        // 存到db
        const res = await contentService.createContent({
          ...detail,
        });
        if (res != null) {
          console.log('保存成功');
          // 关一下页面
          await detailPage.close();
        }
      });
      // 爬取下一页
      let nextPage = await page.$('.ant-pagination-item:not(.ant-pagination-item-active)');
      let currentPage = 2;
      while (nextPage && currentPage <= 2) {
        console.log(`Clicking next page: ${currentPage}`);
        await new Promise(resolve => setTimeout(resolve, 50));
        await Promise.all([
          nextPage.click(),
          page.waitForSelector('.ant-pagination-item-active'),
        ]);
        const html = await page.evaluate(() => {
          return document.documentElement.outerHTML;
        });
        const list = await this.parseListPage(html);
        await Promise.all(list.map(async (item) => {
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
          const res = await contentService.createContent({
            ...detail,
          });
          if (res != null) {
            console.log('保存成功');
            await detailPage.close();
          }
        }));
        nextPage = await page.$(`.ant-pagination-item-${currentPage + 1}`);
        currentPage++;
      }
      console.log('爬取完成', result);
    } catch (error) {
      console.log(error);
    } finally {
      try {
        await browser.close();
      } catch (error) {
        console.log(error);
      }
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