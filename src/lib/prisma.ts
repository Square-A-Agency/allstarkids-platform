import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Pool settings for a serverless runtime (Vercel functions) talking to the
 * Supabase pooler.
 *
 * Every function instance owns its own pg Pool, and instances that Vercel
 * freezes keep their sockets open, so the per-instance footprint is what
 * decides whether the pooler's client limit is hit. On 2026-09-14 the
 * default pool (max 10) plus five parallel queries per admin page exhausted
 * the session-mode limit of 15 clients (EMAXCONNSESSION) and every admin
 * page returned a server error until the instances died.
 *
 * Production should point DATABASE_URL at the transaction pooler (port 6543),
 * which multiplexes clients over a shared backend pool. These caps keep each
 * instance small either way. Migrations still need session mode; run them
 * locally against port 5432.
 */
export interface PoolConfig {
  connectionString: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export function buildPoolConfig(connectionString: string | undefined): PoolConfig {
  const trimmed = connectionString?.trim();
  if (!trimmed) throw new Error("DATABASE_URL is not set");
  return {
    connectionString: trimmed,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  };
}

function createPrismaClient() {
  const adapter = new PrismaPg(buildPoolConfig(process.env.DATABASE_URL));
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
