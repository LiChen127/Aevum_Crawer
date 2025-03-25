
/**
 * 任务配置类型
 */
type taskDataConfig = {
  taskId: number;
  url: string;
  isDynamic: boolean;
  repeat: {
    every: number,
    limit: number
  };
  crawler: any; // @todo: 实现一个基类爬虫实例
  priority: number;
  createTime: Date;
  updateTime: Date;
}

export {
  taskDataConfig
};