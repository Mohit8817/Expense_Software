/**
 * Create the platform developer user (Settings-only access via is_developer flag).
 *
 * Usage: node scripts/seedDeveloperUser.js
 * Optional env: DEVELOPER_EMAIL, DEVELOPER_PASSWORD
 */
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const prisma = new PrismaClient();

const EMAIL = process.env.DEVELOPER_EMAIL || "developer@klk.co.in";
const PASSWORD = process.env.DEVELOPER_PASSWORD || "Developer@123";

async function main() {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ user_id: "developer" }, { is_developer: true }] },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        user_id: "developer",
        username: "Developer",
        email: EMAIL,
        password: PASSWORD,
        company_id: "SYSTEM",
        reporting_head: "System",
        designation: "Developer",
        is_developer: true,
        is_tenant_admin: false,
        status: true,
      },
    });
    console.log(`Updated developer user (id=${existing.id}, email=${EMAIL})`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      company_id: "SYSTEM",
      user_id: "developer",
      username: "Developer",
      email: EMAIL,
      password: PASSWORD,
      reporting_head: "System",
      doj: new Date(),
      designation: "Developer",
      is_developer: true,
      is_tenant_admin: false,
      status: true,
      created_by: "system",
    },
  });

  console.log(`Created developer user (id=${user.id}, user_id=developer, email=${EMAIL})`);
  console.log("Login with the email/password above. Access is Settings-only.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
