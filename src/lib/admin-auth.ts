import { auth, currentUser } from "@clerk/nextjs/server";

function parseList(value: string | undefined): string[] {
  return (value || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * ID allowlist check against ADMIN_USER_IDS (comma-separated Clerk user IDs).
 * Synchronous and cheap; kept for callers that already hold a userId.
 */
export function isAdminUser(userId: string | null): boolean {
  if (!userId) return false;
  return parseList(process.env.ADMIN_USER_IDS).includes(userId);
}

/**
 * Full admin check for the signed-in user: passes if the Clerk user ID is in
 * ADMIN_USER_IDS, or if any VERIFIED email on the account is in ADMIN_EMAILS
 * (comma-separated, case-insensitive).
 *
 * Only verified emails count: Clerk lets anyone attach an unverified email
 * to their account, so matching those would let a stranger claim an admin
 * address and walk in.
 *
 * Note: ADMIN_EMAILS (allowlist) is distinct from ADMIN_EMAIL (singular),
 * which is the notification recipient for new enrollment submissions.
 */
export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  if (isAdminUser(userId)) return true;

  const adminEmails = parseList(process.env.ADMIN_EMAILS).map((e) => e.toLowerCase());
  if (adminEmails.length === 0) return false;

  const user = await currentUser();
  const verifiedEmails =
    user?.emailAddresses
      ?.filter((e) => e.verification?.status === "verified")
      .map((e) => e.emailAddress.toLowerCase()) ?? [];

  return verifiedEmails.some((email) => adminEmails.includes(email));
}
