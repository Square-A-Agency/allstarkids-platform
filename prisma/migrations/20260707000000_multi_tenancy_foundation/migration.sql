-- ═══════════════════════════════════════════════════════════════════════════
-- Multi-tenancy foundation
--
-- 1. Creates the organizations (tenant) table
-- 2. Adds organizationId to every domain table (nullable at first)
-- 3. Backfills existing rows into a default org (All-Star Kids Academy)
-- 4. Tightens columns to NOT NULL + adds FKs and indexes
-- 5. Replaces the global-unique clerkUserId on families with a per-org unique
-- 6. Enables Row Level Security with tenant-isolation policies
--
-- NOTE ON RLS STAGING: policies are ENABLED but not FORCED in this migration.
-- The Prisma connection currently runs as the table owner, which bypasses
-- non-forced RLS, so the app keeps working while every call site is migrated
-- to the withOrg() tenant context helper (src/lib/tenant.ts). A follow-up
-- migration flips to FORCE ROW LEVEL SECURITY once that is complete.
-- See docs/adr/0001-multi-tenancy.md.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Organizations table ──────────────────────────────────────────────────

CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "clerkOrgId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'GA',
    "formPack" TEXT NOT NULL DEFAULT 'ga-decal',
    "adminEmail" TEXT,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
CREATE UNIQUE INDEX "organizations_clerkOrgId_key" ON "organizations"("clerkOrgId");

-- ── 2. Add organizationId columns (nullable for backfill) ───────────────────

ALTER TABLE "families"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "children"                ADD COLUMN "organizationId" TEXT;
ALTER TABLE "enrollment_applications" ADD COLUMN "organizationId" TEXT;
ALTER TABLE "application_documents"   ADD COLUMN "organizationId" TEXT;
ALTER TABLE "job_openings"            ADD COLUMN "organizationId" TEXT;
ALTER TABLE "staff_applications"      ADD COLUMN "organizationId" TEXT;

-- ── 3. Backfill: existing data belongs to the founding tenant ───────────────

INSERT INTO "organizations" ("id", "name", "slug", "state", "formPack", "createdAt", "updatedAt")
VALUES ('org_allstarkids', 'All-Star Kids Academy', 'allstarkids', 'GA', 'ga-decal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

UPDATE "families"                SET "organizationId" = 'org_allstarkids' WHERE "organizationId" IS NULL;
UPDATE "children"                SET "organizationId" = 'org_allstarkids' WHERE "organizationId" IS NULL;
UPDATE "enrollment_applications" SET "organizationId" = 'org_allstarkids' WHERE "organizationId" IS NULL;
UPDATE "application_documents"   SET "organizationId" = 'org_allstarkids' WHERE "organizationId" IS NULL;
UPDATE "job_openings"            SET "organizationId" = 'org_allstarkids' WHERE "organizationId" IS NULL;
UPDATE "staff_applications"      SET "organizationId" = 'org_allstarkids' WHERE "organizationId" IS NULL;

-- ── 4. Tighten: NOT NULL, foreign keys, indexes ──────────────────────────────

ALTER TABLE "families"                ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "children"                ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "enrollment_applications" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "application_documents"   ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "job_openings"            ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "staff_applications"      ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "families"                ADD CONSTRAINT "families_organizationId_fkey"                FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "children"                ADD CONSTRAINT "children_organizationId_fkey"                FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "application_documents"   ADD CONSTRAINT "application_documents_organizationId_fkey"   FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_openings"            ADD CONSTRAINT "job_openings_organizationId_fkey"            FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "staff_applications"      ADD CONSTRAINT "staff_applications_organizationId_fkey"      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "families_organizationId_idx"                       ON "families"("organizationId");
CREATE INDEX "children_organizationId_idx"                       ON "children"("organizationId");
CREATE INDEX "enrollment_applications_organizationId_idx"        ON "enrollment_applications"("organizationId");
CREATE INDEX "enrollment_applications_organizationId_status_idx" ON "enrollment_applications"("organizationId", "status");
CREATE INDEX "application_documents_organizationId_idx"          ON "application_documents"("organizationId");
CREATE INDEX "job_openings_organizationId_idx"                   ON "job_openings"("organizationId");
CREATE INDEX "staff_applications_organizationId_idx"             ON "staff_applications"("organizationId");

-- ── 5. Family uniqueness becomes per-organization ────────────────────────────

DROP INDEX "families_clerkUserId_key";
CREATE UNIQUE INDEX "families_organizationId_clerkUserId_key" ON "families"("organizationId", "clerkUserId");

-- ── 6. Row Level Security: tenant isolation policies ────────────────────────
-- Tenant context is provided per-transaction via:
--   SET LOCAL app.current_org_id = '<org id>'
-- (see withOrg() in src/lib/tenant.ts). If the setting is absent,
-- current_setting(..., true) returns NULL and the policy denies all rows —
-- default-deny by construction.

ALTER TABLE "organizations"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "families"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "children"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "enrollment_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "application_documents"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_openings"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "staff_applications"      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON "organizations"
  USING ("id" = current_setting('app.current_org_id', true));

CREATE POLICY "tenant_isolation" ON "families"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY "tenant_isolation" ON "children"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY "tenant_isolation" ON "enrollment_applications"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY "tenant_isolation" ON "application_documents"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY "tenant_isolation" ON "job_openings"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

CREATE POLICY "tenant_isolation" ON "staff_applications"
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));
