// Knowyourself website crawler
import axios from "axios";
import { CrawlerConfig } from "../../types/crawler.interface.ts";
import * as cheerio from "cheerio";
import ApiCrawler from "../utils/ApiCrawler.ts";
import puppeteer from "puppeteer";

class KnowyourselfCrawler {
  private config: CrawlerConfig;

  private apiCrawler: ApiCrawler;
  constructor(config: CrawlerConfig) {
    this.config = config;
    this.apiCrawler = new ApiCrawler();
  }

  // 爬取静态页面
  public async crawlStatic(url: string): Promise<string> {
    const response = await axios.get(url, {
      headers: this.config.headers,
      timeout: this.config.timeout,
    });
    return response.data;
  }

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
  public async parseListPage(html: string): Promise<any> {
    const $ = cheerio.load(html);
    const result: any[] = [];
    $('article').find('.card-item').each((index, element) => {
      console.log(element);
      const title = $(element).find('.card-item-content').find('h2').text();
      // link就是card-item就是a标签
      const link = element.attribs.href;
      result.push({ title, link });
      // 下一页
      // ant-pagination-item ant-pagination-item-1 ant-pagination-item-active
      // const nextLink = $('.section1-pagination').find("ant-pagination-item-active");

    });
    return result;
  }

  // 爬取动态分页内容
  public async crawlDynamic(): Promise<any> {
    const res = await this.apiCrawler.crawlApi();
    if (res != null) {
      return res;
    } else {
      return null;
    }
  }

  // 爬取动态分页内容 利用puppeteer
  public async crawlList(): Promise<any> {
    const browser = await puppeteer.launch({
      executablePath: `D:\\daily_soft\\Google\\Chrome\\Application\\chrome.exe`,
      headless: false, // 可选：设置为 false 以便观察浏览器操作
    });
    const page = await browser.newPage();
    const result: any[] = [];

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    let hasNextPage = true;
    let currentPage = 1;

    while (hasNextPage) {
      await page.goto(`https://www.knowyourself.cc/list`, {
        waitUntil: "networkidle0",
      });

      const html = await page.content();
      const list = await this.parseList(html);
      console.log(list);
      // 获取当前页面的页数
      // .ant-pagination-item-active
      currentPage = await page.$eval('.ant-pagination-item-active', el => Number(el.textContent));

      for (const item of list) {
        const detailUrl = `https://www.knowyourself.cc${item.link}`;
        const detailHTML = await this.crawlStatic(detailUrl);
        const detail = await this.parseDetail(detailHTML);
        if (detail.content !== null) {
          result.push({
            title: detail.title,
            content: detail.content,
            number: result.length,
          });
        }
      }

      // 1 2 3 4 5 "Next 5 Pages" 6 7 8 9 10 "Next 5 Pages" 11 12 13 14 15 "348"
      // const nextPageButton = await page.$('.ant-pagination-item');
      // 只要当前dom下面的下一个同级元素存在，就可以点击
      // 它是动态渲染,query的,而不是params的,所以要点击下一页,而不是直接跳转
      // const nextPageButton = await page.$('.ant-pagination-item-active + .ant-pagination-item');
      const nextPageSelector = `.ant-pagination-item-${currentPage + 1}`;
      const nextPageBtn = await page.$(nextPageSelector) || await page.$('.Next 5 Pages');
      if (nextPageBtn && currentPage < 10) {
        console.log(`Clicking on next page button: ${nextPageSelector}`);
        await page.click(nextPageSelector);
        await page.waitForNavigation({ waitUntil: "networkidle0" });
        currentPage++;
      } else {
        hasNextPage = false;
      }
    }

    await browser.close();
    console.log(`Total articles: ${result.length}`);
    return result.sort((a, b) => a.number - b.number);
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

export default KnowyourselfCrawler;