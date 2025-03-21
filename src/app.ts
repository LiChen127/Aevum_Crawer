import express from "express";
import { prisma } from "./services/prisma.service.ts";
import taskService from "./services/task.service.ts";
// import queueService from "./services/queue.service.ts";

const app = express();

const PORT = process.env.PORT || 3000;


app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// 创建爬虫任务
app.post('/tasks', async (req, res) => {
  try {
    const { url, priority } = req.body;
    const task = await taskService.createTask(url, priority);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

// 动态爬取
app.post("/dynamic-tasks", async (req, res) => {
  try {
    const { url, priority } = req.body;
    const task = await taskService.createTask(url, priority, true);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});


// 获取所有任务
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { result: true }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

// // 重试失败的任务
// app.post('/tasks/:id/retry', async (req, res) => {
//   // try {
//   //   const taskId = parseInt(req.params.id);
//   //   const task = await prisma.task.findUnique({
//   //     where: { id: taskId }
//   //   });

//   //   if (!task) {
//   //     return res.status(404).json({ error: '任务不存在' });
//   //   }
//   //   await taskService.createTask(task.url, task.priority);
//   //   res.json({ message: '任务已重新加入队列' });
//   // } catch (error) {
//   //   res.status(500).json({ error: (error as any).message });
//   // }
// });

// 获取任务状态
app.get('/tasks/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { result: true }
    });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

// 启动网站爬虫
app.post('/crawl-website', async (req, res) => {
  try {
    const { startPage = 1 } = req.body;
    // await queueService.addWebsiteCrawlerTask(startPage);
    await taskService.createTask(`https://www.example.com/page/${startPage}`, 0, true);
    res.json({ message: 'Website crawler started' });
  } catch (error) {
    res.status(500).json({ error: (error as any).message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running in http:localhost:${PORT}`);
});