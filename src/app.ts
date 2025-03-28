import express from "express";
import konwyourselfCrawler from "./crawler/website/knowyourself.ts";
import tagService from "./storages/knowyourself/tag.ts";
import contentService from "./storages/knowyourself/content.ts";
import yixinli from "./crawler/website/yixinli.ts";

const PORT = "3000";

const app = express();

app.post("/kys/list", async (req, res) => {
  const list = await konwyourselfCrawler.crawListPage();
  res.json(list);
});

app.get("/kys/list", async (req, res) => {
  const list = await contentService.getAll();
  res.json(list);
});

app.post("/kys/tags", async (req, res) => {
  const tags = await konwyourselfCrawler.crawlerTags();
  res.json(tags);
});

app.get("/kys/tags", async (req, res) => {
  const tags = await tagService.getTags();
  // 去重
  const uniqueTags = tags.filter((tag, index, self) =>
    index === self.findIndex(t => t.text === tag.text)
  );
  res.json(uniqueTags);
});

app.get('/yxl/tags', async (req, res) => {
  const tags = await yixinli.crawAllTags();
  res.json(tags);
});

app.get("/yxl/list", async (req, res) => {
  const list = await yixinli.crawlPageList();
  res.json(list);
});

app.get("/yxl/detail", async (req, res) => {
  const detail = await yixinli.crawlDetail();
  res.json(detail);
});

app.get("/yxl/pages", async (req, res) => {
  const pages = await yixinli.crawlList();
  res.json(pages);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});