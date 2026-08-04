// scripts/encrypt-existing-ssns.ts
// One-off, idempotent: encrypts any plain-text preKSsn values already in
// the database. Run with: npx tsx scripts/encrypt-existing-ssns.ts
import { prisma } from "../src/lib/prisma";
import { encryptSsn } from "../src/lib/ssn-crypto";

async function main() {
  const apps = await prisma.enrollmentApplication.findMany({
    where: { preKSsn: { not: null } },
    select: { id: true, preKSsn: true },
  });

  let updated = 0;
  for (const app of apps) {
    const current = app.preKSsn as string;
    const encrypted = encryptSsn(current);
    if (encrypted !== current) {
      await prisma.enrollmentApplication.update({
        where: { id: app.id },
        data: { preKSsn: encrypted },
      });
      updated++;
    }
  }
  console.log(`Checked ${apps.length} applications, encrypted ${updated}.`);
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
