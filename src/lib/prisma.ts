import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Singleton pattern: prevents exhausting database connections during
// Next.js hot reloads in development. In production, a single instance
// is created normally.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// In Prisma v7, driver adapters are required for network connections.
// Pool configuration optimizes connection reuse and prevents exhaustion.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum concurrent connections
  idleTimeoutMillis: 30_000, // Close idle connections after 30s
  connectionTimeoutMillis: 5_000, // Fail fast if pool is exhausted
});
const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
