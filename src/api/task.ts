import express from "express";

const taskRouter = express.Router();

/**
 * 创建任务: 包括任务优先级、任务类型、爬取网站
 */
taskRouter.post("/task/create", async (req, res) => {

});

// 获取任务
taskRouter.get("/task/get", async (req, res) => {
  // status
});


export default taskRouter;