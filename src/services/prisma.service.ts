import { PrismaClient } from "@prisma/client";

class PrismaService {
  private static instance: PrismaClient;

  static getInstance(): PrismaClient {
    // 单例模式
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient();
    }
    return PrismaService.instance;
  }
}

export const prisma = PrismaService.getInstance();