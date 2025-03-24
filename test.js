import puppeteer from "puppeteer";
import fs from "fs";

// 启动浏览器并创建页面
(async () => {
  const browser = await puppeteer.launch({
    // args: ['--proxy-server=http://16YUN:16IP@www.16yun.cn:3100'], // 替换为正确的代理服务器地址
    // executablePath: `D:\\daily_soft\\Google\\Chrome\\Application\\chrome.exe`,
    // headless: false
  });

  const page = await browser.newPage();

  await page.goto('https://www.baidu.com', { waitUntil: 'networkidle0' });

  await page.type("#kw", "puppeteer");

  await page.click("#su");

    // 点击搜索按钮
  await page.click('#su');

  // 等待搜索结果的列表出现
  await page.waitForSelector('#content_left');

  // 获取搜索结果的第一条链接的标题和网址
  const firstResult = await page.evaluate(() => {
    // 获取第一条链接的元素
    const firstLink = document.querySelector('#content_left .result.c-container a');
    // 返回标题和网址
    return {
      title: firstLink.innerText,
      url: firstLink.href
    };
  });

  // 将标题和网址保存到一个文件中
  fs.writeFileSync('result.txt', `${firstResult.title}\n${firstResult.url}`);

  // 关闭浏览器
  await browser.close();
})();
