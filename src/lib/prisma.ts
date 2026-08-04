import { PrismaClient } from "@/generated/prisma";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Falls back to a syntactically-valid placeholder rather than leaving this
// undefined. Prisma Client validates env("DATABASE_URL") eagerly at
// construction time, not just on first query — if the variable is
// completely unset (as opposed to just pointing at the wrong database),
// `new PrismaClient()` throws immediately. That's fatal wherever this
// module gets imported at build/analysis time (e.g. by a deploy platform
// tracing route modules), not just at request time. NETLIFY_DATABASE_URL
// is what Netlify DB auto-injects; DATABASE_URL is what we set explicitly
// once we have the real connection string.
const datasourceUrl =
  process.env.DATABASE_URL ||
  process.env.NETLIFY_DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
