
// /**
//  * 爬虫任务消费队列
//  */
// class CrawlerQueue {
//   private queue: any[] = [];
//   private maxSize: number = 100;
//   private isRunning: boolean = false;
//   private interval: any;
//   private crawler: any;
//   private crawlerType: string;
//   private crawlerUrl: string;
//   private crawlerIsDynamic: boolean;
//   private crawlerPriority: number;
//   private crawlerTaskId: number;
//   private crawlerTask: any;

//   constructor(
//     crawler: any,
//     crawlerType: string,
//     crawlerUrl: string,
//     crawlerIsDynamic: boolean,
//     crawlerPriority: number,
//     crawlerTaskId: number,
//     crawlerTask: any) {
//     this.crawler = crawler;
//     this.crawlerType = crawlerType;
//     this.crawlerUrl = crawlerUrl;
//     this.crawlerIsDynamic = crawlerIsDynamic;
//     this.crawlerPriority = crawlerPriority;
//     this.crawlerTaskId = crawlerTaskId;
//     this.crawlerTask = crawlerTask;
//   }

// }