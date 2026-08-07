import { PrismaClient } from "@prisma/client";
import { TENANT_PERMISSIONS } from "../src/constants/tenantPermissions.js";

const prisma = new PrismaClient();
const createdBy = process.argv[2] || "1";

async function main() {
  let created = 0;
  let updated = 0;

  for (const perm of TENANT_PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { name: perm.name } });
    if (existing) {
      await prisma.permission.update({
        where: { id: existing.id },
        data: { label: perm.label, module: perm.module },
      });
      updated += 1;
    } else {
      await prisma.permission.create({
        data: { ...perm, created_by: String(createdBy) },
      });
      created += 1;
    }
  }

  console.log(`Tenant permissions — Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
