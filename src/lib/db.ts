import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getCleanDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;
  // Neon pooler (-pooler.) does not support SCRAM channel binding (channel_binding=require) via PgBouncer.
  if (url.includes("-pooler.") && url.includes("channel_binding=require")) {
    url = url.replace(/[?&]channel_binding=require/g, "").replace(/\?&/, "?");
  }
  // Ensure pgbouncer=true is present when using PgBouncer pooler to prevent prepared statement collisions in Prisma
  if (url.includes("-pooler.") && !url.includes("pgbouncer=true")) {
    url += (url.includes("?") ? "&" : "?") + "pgbouncer=true";
  }
  return url;
}

const cleanUrl = getCleanDatabaseUrl();

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(cleanUrl ? { datasources: { db: { url: cleanUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

