import express from "express";
import konwyourselfCrawler from "./crawler/website/knowyourself.ts";

const PORT = "3000";

const app = express();

app.get("/kys/list", async (req, res) => {
  const list = await konwyourselfCrawler.crawListPage();
  res.json(list);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});