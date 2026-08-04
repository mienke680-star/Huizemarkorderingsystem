import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Netlify DB (via @netlify/database) injects the live connection string as
// NETLIFY_DB_URL at runtime — not DATABASE_URL, and not (as older docs
// suggested) NETLIFY_DATABASE_URL. It takes priority so the deployed app
// always talks to the real provisioned database. DATABASE_URL remains the
// override for local dev (see .env) and any environment where it's set
// explicitly. The placeholder guards against Prisma Client's eager
// env-validation: it throws at construction time (not just on first
// query) when the resolved URL is completely unset, which is fatal
// wherever this module gets imported during build-time route analysis.
const datasourceUrl =
  process.env.NETLIFY_DB_URL ||
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
