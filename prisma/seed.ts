import { PrismaClient } from "../src/generated/prisma";
import { seedDatabase } from "../src/lib/seed-data";

const prisma = new PrismaClient();

seedDatabase(prisma)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
