import express from "express";
import { TaskService } from './services/task.service';
import { prisma } from "./services/prisma.service";

// import { createBullBoard } from "@b"

const app = express();

const PORT = process.env.PORT || 3000;

const taskService = new TaskService();

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

app.listen(PORT, () => {
  console.log(`Server is running in http:localhost:${PORT}`);
});