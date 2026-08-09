import { PrismaClient } from "@/generated/prisma";

// Singleton pattern: prevents exhausting database connections during
// Next.js hot reloads in development. In production, a single instance
// is created normally.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
