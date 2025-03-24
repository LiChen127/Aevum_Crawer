import { prisma } from "../../services/prisma.service.ts";

interface Content {
  title: string;
  content: string;
}

class ContentService {
  async getContent(id: string): Promise<any> {
    const idByProcessed = BigInt(id);
    const result = await prisma.knowyourselfContent.findFirst({
      where: {
        id: idByProcessed,
      }
    });
    result!.content = JSON.parse(result?.content as string);
    return result;
  }

  async createContent(params: Content): Promise<any> {
    return prisma.knowyourselfContent.create({
      data: {
        title: params.title,
        content: JSON.stringify(params.content),
      }
    });
  }
  async getAll(): Promise<any> {
    const list = await prisma.knowyourselfContent.findMany();
    return list;
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