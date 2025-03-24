import express from "express";
import KnowyourselfCrawler from "./crawler/website/knowyourself.ts";

const PORT = "3000";

const app = express();

const knowyourselfCrawler = new KnowyourselfCrawler({
  concurrency: 3, // 并发数
  retryTimes: 5,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'
  }
});

app.post("/kys/tag", async (req, res) => {
  // const tags = await knowyourselfCrawler.
  const html = await knowyourselfCrawler.crawlStatic("https://www.knowyourself.cc/list");
  const tags = await knowyourselfCrawler.parseContentToGetTags(html);
  res.json(tags);
});

app.post("/kys/list", async (req, res) => {
  const list = await knowyourselfCrawler.crawlList();
  res.json(list);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});