// Prisma v7 configuration for ClassPilot + Supabase
//
// datasource.url    → pooled connection (port 6543, pgbouncer=true) for runtime queries
// datasource.directUrl → direct connection (port 5432) for migrations
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    directUrl: process.env["DIRECT_URL"],
  },
});
