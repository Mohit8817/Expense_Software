import { PrismaClient } from "@prisma/client";
import { ACCOUNT_PERMISSIONS } from "../src/constants/accountPermissions.js";

const prisma = new PrismaClient();

const companyId = process.argv[2];
const createdBy = process.argv[3] || "1";

if (!companyId) {
  console.error("Usage: node scripts/seedAccountPermissions.js <company_id> [created_by_user_id]");
  console.error("Example: node scripts/seedAccountPermissions.js klk1234 1");
  process.exit(1);
}

async function main() {
  let created = 0;
  let skipped = 0;

  for (const perm of ACCOUNT_PERMISSIONS) {
    const existing = await prisma.permission.findFirst({
      where: { name: perm.name, company_id: companyId },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.permission.create({
      data: {
        name: perm.name,
        label: perm.label,
        module: perm.module,
        company_id: companyId,
        created_by: String(createdBy),
      },
    });
    created += 1;
  }

  console.log(`Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
