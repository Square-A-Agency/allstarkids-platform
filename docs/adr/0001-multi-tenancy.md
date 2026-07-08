# ADR-0001: Multi-tenancy foundation

Date: 2026-07-07 · Status: Accepted

## Context

The platform was built single-tenant for All-Star Kids Academy. To sell it as
a SaaS to multiple daycare centers, every domain row must belong to exactly one
Organization, with isolation that survives application bugs.

## Decision

Two isolation layers:

1. **App layer** — every Prisma query is explicitly scoped by `organizationId`.
   Parent flows resolve the org via `DEFAULT_ORG_SLUG` (until per-org domain
   routing); staff/directors resolve via their Clerk Organization
   (`organizations.clerkOrgId`). Admin authorization moved from the
   `ADMIN_USER_IDS` env allowlist to Clerk org roles (`org:admin`), with the
   env var kept as a deprecated fallback during rollout.

2. **Data layer** — Postgres Row Level Security on every table, keyed to
   `current_setting('app.current_org_id')`. Absent context = zero rows
   (default deny). `withOrg()` in `src/lib/tenant.ts` sets the context with
   `SET LOCAL` inside a transaction (pool-safe).

   Exception: `organizations` is the tenant *directory*, not tenant data.
   `resolveOrg()` must read it by slug/clerkOrgId before any context exists
   (that lookup is what establishes the context), so an org-scoped policy
   would deadlock bootstrapping under FORCE RLS. Its policies are therefore:
   SELECT open, UPDATE restricted to the current org, INSERT/DELETE
   default-deny (onboarding/offboarding is a privileged operation).

## RLS staging

Policies are ENABLED but not FORCED in this migration. The Prisma connection
runs as the table owner, which bypasses non-forced RLS, so the app keeps
working while call sites migrate to `withOrg()`. Follow-ups:

- [ ] Route all queries through `withOrg()`
- [ ] Connect as a non-owner `app_user` role
- [ ] `ALTER TABLE ... FORCE ROW LEVEL SECURITY` on all tables
- [ ] Remove `ADMIN_USER_IDS` fallback after Clerk Organizations rollout

## Verification

`scripts/rls-isolation-test.sql` proves, against a live Postgres with two
seeded tenants and a non-owner role: default deny without context; each org
sees only its rows; cross-tenant UPDATE affects 0 rows; cross-tenant INSERT is
rejected by WITH CHECK. Run it in CI against the migrated schema.

## Consequences

- `families.clerkUserId` uniqueness is now per-org (same parent could enroll
  at two centers).
- All new tables MUST carry `organizationId` + an RLS policy; PR review should
  treat `prisma/migrations` as security-sensitive.
- The founding tenant is backfilled as `org_allstarkids` (slug `allstarkids`);
  deployments must set `DEFAULT_ORG_SLUG=allstarkids`.
