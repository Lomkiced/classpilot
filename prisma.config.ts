// Prisma v7 configuration for ClassPilot + Supabase
//
// datasource.url    → pooled connection (port 6543, pgbouncer=true) for runtime queries
// datasource.directUrl → direct connection (port 5432) for migrations
import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DIRECT_URL"], // CLI needs the direct connection for schema changes
  },
});
