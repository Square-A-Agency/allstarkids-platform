-- Fix RLS bootstrapping deadlock on "organizations" (PR #1 review).
--
-- resolveOrg() must look an org up by slug/clerkOrgId BEFORE any tenant
-- context exists — that lookup is what establishes app.current_org_id in the
-- first place. The original org_isolation policy
--   USING ("id" = current_setting('app.current_org_id', true))
-- therefore deadlocks once we switch to a non-owner role + FORCE ROW LEVEL
-- SECURITY (ADR-0001 staging plan): no context -> can't read organizations ->
-- can't ever set context.
--
-- The organizations table is the tenant *directory* (name/slug/clerkOrgId),
-- not tenant data, so reads are open to the app role while writes stay
-- restricted to the current org. INSERT/DELETE get no policy at all:
-- default-deny — org onboarding/offboarding runs as a privileged operation,
-- never through the app role.

DROP POLICY "org_isolation" ON "organizations";

CREATE POLICY "org_directory_read" ON "organizations"
  FOR SELECT USING (true);

CREATE POLICY "org_self_update" ON "organizations"
  FOR UPDATE
  USING ("id" = current_setting('app.current_org_id', true))
  WITH CHECK ("id" = current_setting('app.current_org_id', true));
