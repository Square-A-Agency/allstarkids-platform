import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";

/**
 * Tenant (Organization) context utilities.
 *
 * Two isolation layers:
 *   1. App layer  — every query is explicitly scoped with organizationId
 *   2. Data layer — Postgres RLS policies keyed to app.current_org_id
 *
 * withOrg() provides both: it opens a transaction, sets the org context for
 * RLS, and hands you a client whose queries are physically incapable of
 * crossing tenants once FORCE ROW LEVEL SECURITY is enabled.
 */

export type OrgContext = {
  orgId: string;
  slug: string;
};

/**
 * Resolve the current organization.
 *
 * Resolution order:
 *   1. Clerk Organization — staff/directors belong to a Clerk org that maps
 *      to organizations.clerkOrgId
 *   2. Default org slug — parents aren't Clerk-org members; until per-org
 *      domains/subdomains land, they resolve to DEFAULT_ORG_SLUG
 *
 * TODO(multi-tenant routing): replace the default-slug fallback with
 * host-based resolution (subdomain → org slug) when the second tenant onboards.
 */
export async function resolveOrg(): Promise<OrgContext | null> {
  const { orgId: clerkOrgId } = await auth();

  if (clerkOrgId) {
    const org = await prisma.organization.findUnique({
      where: { clerkOrgId },
      select: { id: true, slug: true },
    });
    if (org) return { orgId: org.id, slug: org.slug };
  }

  const defaultSlug = process.env.DEFAULT_ORG_SLUG;
  if (defaultSlug) {
    const org = await prisma.organization.findUnique({
      where: { slug: defaultSlug },
      select: { id: true, slug: true },
    });
    if (org) return { orgId: org.id, slug: org.slug };
  }

  return null;
}

/** Transaction-scoped client with RLS tenant context applied. */
export type OrgScopedClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Run `fn` inside a transaction with the Postgres RLS org context set.
 *
 * Usage:
 *   const org = await requireOrg();
 *   const families = await withOrg(org.orgId, (tx) =>
 *     tx.family.findMany() // RLS guarantees only this org's rows
 *   );
 *
 * SET LOCAL scopes the setting to this transaction only — no leakage across
 * pooled connections.
 */
export async function withOrg<T>(
  orgId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    // Parameterized to avoid any injection path, even though orgId is internal.
    await tx.$executeRaw`SELECT set_config('app.current_org_id', ${orgId}, true)`;
    return fn(tx);
  });
}

/** Convenience: resolve org or throw a 401-worthy error. */
export async function requireOrg(): Promise<OrgContext> {
  const org = await resolveOrg();
  if (!org) {
    throw new Error(
      "No organization context. Staff must belong to a Clerk organization; " +
        "parent flows require DEFAULT_ORG_SLUG to be configured."
    );
  }
  return org;
}
