
import puppeteer from "puppeteer";

// 反自动化检测
const hideAutomation = async (browser: puppeteer.Browser, page: puppeteer.Page) => {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.setExtraHTTPHeaders({
    'accept-language': 'zh-CN,zh;q=0.9',
    'sec-fetch-site': 'same-origin'
  });
};

/**
 * 随机UA
 */
const getRandomUserAgent = () => {
  const agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15...',
  ];
  return agents[Math.floor(Math.random() * agents.length)];
};
/**
 * 随机延时
 */
const randomDelay = async (min: number, max: number) => {
  await new Promise(resolve => {
    setTimeout(resolve, min + Math.random() * (max - min));
  });
};

export {
  hideAutomation,
  getRandomUserAgent,
  randomDelay,
};