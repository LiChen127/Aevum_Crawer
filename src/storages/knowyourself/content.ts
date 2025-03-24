import { prisma } from "../../services/prisma.service.ts";

interface Content {
  title: string;
  content: string;
  typeId: number;
}

class ContentService {
  async getContent(id: string): Promise<any> {
    const idByProcessed = BigInt(id);
    return prisma.knowyourselfContent.findFirst({
      where: {
        id: idByProcessed,
      }
    });
  }

  async createContent(params: Content): Promise<any> {
    return prisma.knowyourselfContent.create({
      data: {
        title: params.title,
        content: params.content,
        typeId: params.typeId,
      }
    });
  }

  async getAll(): Promise<any> {
    return prisma.knowyourselfContent.findMany();
  }
}

export default new ContentService();