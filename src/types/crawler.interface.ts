export interface CrawlerConfig {
  concurrency: number;
  retryTimes: number;
  timeout: number;
  headers?: Record<string, string>;
  useProxy?: boolean;
}

export interface CrawlerResult {
  url: string;
  content: any;
  timestamp: Date;
}