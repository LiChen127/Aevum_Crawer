# Aevum爬虫服务

## 背景

本项目为Aevum提供内容爬取服务，构建一个分布式爬虫服务。

## 架构设计

## 技术栈

### 语言选择

Node.js TypeScript

### 框架选择

Express, 提供API服务

### 库选择

1. Redis: 分布式任务队列与状态存储
2. Bull/Agenda===  =
3. Axios: HTTP请求库
4. Cheerio: 用于解析HTML
5. Puppeteer: 处理浏览器操作，动态渲染
6. Winston: 日志记录库
7. ELK Stack: 日志收集与分析
1. Prometheus + Grafana: 监控指标和可视化
2.  lodash: 工具库
11. p-limit: 控制并发数
12. dayjs: 时间处理库

### 存储选择

1. Mysql: 存储结构化数据
2. ORM: Prisma ORM

### 反爬策略

1. Proxy Pool: 代理IP池
2. User-Agent库: 随机生成User-Agent
3. OCR服务: 验证码识别
4. Puppeteer-extra-plugin-stealth：绕过反爬检测。

## 架构设计

- 任务调度层
- 爬取执行层
- 数据处理层
- 反爬中间件
- 服务通信层

### 数据流

管理后台 -> 创建任务 -> Bull队列 -> 爬虫节点 -> 反爬中间件 -> target web -> 数据处理层 -> 数据库 -> RPC服务 -> 通知外部系统
