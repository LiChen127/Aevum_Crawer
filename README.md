# Aevum爬虫服务

## 背景

本项目为Aevum提供内容爬取服务，构建一个分布式爬虫服务。

## 技术栈

### 语言选择

Node.js TypeScript

### 框架选择

Express, 提供API服务

### 库选择

1. Redis: 分布式任务队列与状态存储
2. Bull/Agenda
3. Axios: HTTP请求库
4. Cheerio: 用于解析HTML
5. Puppeteer: 处理浏览器操作，动态渲染
6. Winston: 日志记录库
7. ELK Stack: 日志收集与分析
8. Jest: 单元测试
9. Prometheus + Grafana: 监控指标和可视化
10. lodash: 工具库
11. p-limit: 控制并发数
12. dayjs: 时间处理库

### 存储选择

1. Mysql: 存储结构化数据
2. MongoDB: 存储非结构化数据
3. ORM: Prisma ORM

### 反爬策略

1. Proxy Pool: 代理IP池
2. User-Agent库: 随机生成User-Agent
3. OCR服务: 验证码识别
4. Puppeteer-extra-plugin-stealth：绕过反爬检测。

## 架构设计

### 核心流程设计

#### 任务调度与URL管理

- 动态任务注入: 通过定时任务或API接口向Redis队列注入种子URL，并设置优先级。
- 分布式去重: 通过Redis的Set数据结构实现分布式去重，避免重复爬取, 结合布隆过滤器优化内存占用
- 任务分发策略:
  - 基于域名哈希的分片策略，确保同一域名的请求分配到固定的Worker节点。
  - 动态负载均衡: 通过Prometheus监控节点负载，自动调整任务分配权重

#### 执行层

- 请求分流:
  - 静态界面: Axios + Cheerio组合
  - 动态渲染: Puppeteer + Cheerio组合
- 反爬:
  - 代理IP池
  - 请求指纹: 随机UA+设备指纹生成器

#### 数据处理管道

- 流式解析: 使用Transform流处理解析HTML，配合Cheerio的流式API降低内存峰值。
- 数据存储: 使用ORM存储结构化数据，MongoDB存储非结构化数据。
- 实时去重: ES索引实现实时去重，避免重复存储。

#### 监控与自愈

- 健康检查: Redis PUB/SUB广播心跳包，节点失联5分钟后触发告警
- 熔断机制: 单个域名连续失败10次则暂停抓取。


`
curl 'https://tapi.knowyourself.cc/platform/getWebsiteArticleList?offset=240&limit=10&type=hunlianqinggan' \
  -H 'accept: application/json, text/plain, */*' \
  -H 'accept-language: zh-CN,zh;q=0.9,en;q=0.8' \
  -H 'content-type: application/json;charset=utf-8' \
  -H 'ky-token;' \
  -H 'origin: https://www.knowyourself.cc' \
  -H 'priority: u=1, i' \
  -H 'referer: https://www.knowyourself.cc/' \
  -H 'sec-ch-ua: "Not A(Brand";v="8", "Chromium";v="132", "Google Chrome";v="132"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-site' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36' \
  -H 'x-appid: 16' \
  -H 'x-sig: f7f299b417b101c252847e7840b1ea53' \
  -H 'x-timestamp: 1742796478372' \
  -H 'x-version: 1.0.0'
`