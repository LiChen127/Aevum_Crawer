import { prisma } from "../../services/prisma.service.ts";

class TagService {
  async getTags(): Promise<any> {
    const tags = await prisma.knowyourselfType.findMany();
    return tags;
  }

  async getByTag(tag: string): Promise<any> {
    const tagData = await prisma.knowyourselfType.findFirst({
      where: {
        text: tag,
      }
    });
    return tagData;
  }

  async createTag(tag: string): Promise<any> {
    const tagData = await prisma.knowyourselfType.create({
      data: {
        text: tag,
      }
    });
    return tagData;
  }

  async batchCreateTag(tag: string[]): Promise<any> {
    return prisma.knowyourselfType.createMany({
      data: tag.map(item => ({
        text: item,
      })),
    });
  }
}

export default new TagService();