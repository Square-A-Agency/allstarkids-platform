-- RLS isolation test — run against a migrated database.
-- Seeds two orgs + a non-owner role, then attempts cross-tenant access.
-- Every SELECT prints its expectation; TEST5 raises a NOTICE with PASS/FAIL.

BEGIN;

INSERT INTO "organizations" ("id","name","slug","updatedAt") VALUES
  ('org_test_a','RLS Test Org A','rls-test-a',now()),
  ('org_test_b','RLS Test Org B','rls-test-b',now());

INSERT INTO "families" ("id","organizationId","clerkUserId","updatedAt","firstName","lastName","email","phone","address","city","zip") VALUES
  ('rls_fam_a','org_test_a','rls_user_a',now(),'Alice','A','a@a.com','1','1 A St','Atlanta','30301'),
  ('rls_fam_b','org_test_b','rls_user_b',now(),'Bob','B','b@b.com','2','2 B St','Atlanta','30302');

DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'rls_test_user') THEN
    CREATE ROLE rls_test_user;
  END IF;
END $$;
GRANT USAGE ON SCHEMA public TO rls_test_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rls_test_user;

SET ROLE rls_test_user;

SELECT 'TEST1 no context (want 0):' AS test,
       count(*) FROM families WHERE id IN ('rls_fam_a','rls_fam_b');

SELECT set_config('app.current_org_id','org_test_a', true);
SELECT 'TEST2 org A (want 1 Alice):' AS test,
       count(*), min("firstName") FROM families WHERE id IN ('rls_fam_a','rls_fam_b');

SELECT set_config('app.current_org_id','org_test_b', true);
SELECT 'TEST3 org B (want 1 Bob):' AS test,
       count(*), min("firstName") FROM families WHERE id IN ('rls_fam_a','rls_fam_b');

UPDATE families SET "firstName"='HACKED' WHERE id='rls_fam_a';
SELECT 'TEST4 cross-tenant update (want 0):' AS test,
       count(*) FROM families WHERE "firstName"='HACKED';

DO $$ BEGIN
  INSERT INTO families ("id","organizationId","clerkUserId","updatedAt","firstName","lastName","email","phone","address","city","zip")
  VALUES ('rls_fam_evil','org_test_a','rls_user_evil',now(),'Evil','E','e@e.com','3','3 E St','Atlanta','30303');
  RAISE NOTICE 'TEST5 FAILED: cross-tenant insert succeeded';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'TEST5 PASSED: cross-tenant insert blocked';
END $$;

-- Org directory: readable without context (bootstrap), writes still fenced.
-- RESET (not set_config with NULL): pre-PG15 set_config errors on NULL, and
-- RESET genuinely unsets rather than setting empty string.
RESET app.current_org_id;
SELECT 'TEST6 org directory read without context (want 2):' AS test,
       count(*) FROM organizations WHERE id IN ('org_test_a','org_test_b');

SELECT set_config('app.current_org_id','org_test_b', true);
UPDATE organizations SET "name"='HACKED' WHERE id='org_test_a';
SELECT 'TEST7 cross-tenant org update (want 0):' AS test,
       count(*) FROM organizations WHERE "name"='HACKED';

DO $$ BEGIN
  INSERT INTO organizations ("id","name","slug","updatedAt")
  VALUES ('org_test_evil','Evil Org','rls-test-evil',now());
  RAISE NOTICE 'TEST8 FAILED: org insert via app role succeeded';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'TEST8 PASSED: org insert via app role blocked';
END $$;

RESET ROLE;
ROLLBACK; -- leaves no test data behind
