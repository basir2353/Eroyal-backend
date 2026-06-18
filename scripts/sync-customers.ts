import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({ select: { id: true, email: true } });
  let updated = 0;

  for (const customer of customers) {
    const result = await prisma.order.aggregate({
      where: {
        customerId: customer.id,
        orderStatus: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      _sum: { total: true },
    });

    const total = result._sum.total?.toNumber() ?? 0;
    await prisma.customer.update({
      where: { id: customer.id },
      data: { totalSpending: total },
    });
    updated += 1;
  }

  console.log(`Synced totalSpending for ${updated} customers from order history.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
