import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // URL used by Prisma CLI commands (migrate, generate, etc.)
  // Runtime PrismaClient receives the connection via @prisma/adapter-pg
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
