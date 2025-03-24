import { prisma } from "../../services/prisma.service.ts";

interface Content {
  title: string;
  content: string;
}

class ContentService {
  async createContent(params: Content): Promise<any> {
    return prisma.knowyourselfContent.create({
      data: {
        title: params.title,
        content: params.content,
      }
    });
  }

  async getAll(): Promise<any> {
    const list = await prisma.knowyourselfContent.findMany();
    // 转换列表中的 BigInt 为字符串
    return list.map(item => ({
      ...item,
      id: item.id.toString(),
    }));
  }

  async batchCreateContent(content: Content[]): Promise<any> {
    return prisma.knowyourselfContent.createMany({
      data: content.map(item => ({
        title: item.title,
        content: JSON.stringify(item.content),
      })),
    });
  }
}

export default new ContentService();