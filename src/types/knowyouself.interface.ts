/**
 * 内容标签
 */
export type KnowyourselfTags = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 内容
 */
export type KnowyourselfContent = {
  id: number;
  tagId: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}