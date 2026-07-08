import { auth } from "@clerk/nextjs/server";

/**
 * Admin authorization — organization-role based.
 *
 * Staff and directors are members of the tenant's Clerk Organization.
 * A user is an admin for the current org if their Clerk org role is
 * org:admin (director) or org:staff_admin.
 *
 * DEPRECATED FALLBACK: ADMIN_USER_IDS (comma-separated Clerk user IDs) is
 * still honored so existing deployments don't lock anyone out mid-migration.
 * Remove once all admins are Clerk-org members. Tracked in ADR-0001.
 */

const ADMIN_ORG_ROLES = new Set(["org:admin", "org:staff_admin", "admin"]);

function isLegacyEnvAdmin(userId: string | null): boolean {
  if (!userId) return false;
  const adminIds = (process.env.ADMIN_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return adminIds.includes(userId);
}

export async function isAdminUser(userId: string | null): Promise<boolean> {
  if (!userId) return false;

  const { userId: sessionUserId, orgId, orgRole } = await auth();

  // Never authorize on behalf of a different user than the active session.
  if (sessionUserId !== userId) return false;

  if (orgId && orgRole && ADMIN_ORG_ROLES.has(orgRole)) return true;

  // Legacy fallback — remove after Clerk Organizations rollout.
  return isLegacyEnvAdmin(userId);
}
