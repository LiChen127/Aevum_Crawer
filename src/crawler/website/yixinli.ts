import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';


class YixinliCrawler {
  // private url 
  public async crawAllTags(): Promise<any> {
    const url = "https://www.xinli001.com/info?source=pc-home";
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'networkidle0' });
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
}

export default new YixinliCrawler();