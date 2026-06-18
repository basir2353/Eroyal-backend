import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@eroyalmango.com").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@123456";

  const role = await prisma.role.findUnique({ where: { name: "super_admin" } });
  if (!role) {
    throw new Error("super_admin role not found. Run: npm run seed");
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    create: {
      name: "Super Admin",
      email,
      password: hash,
      roleId: role.id,
      status: "ACTIVE",
    },
    update: {
      password: hash,
      status: "ACTIVE",
      roleId: role.id,
    },
  });

  console.log(`Admin account ready: ${email} / ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
