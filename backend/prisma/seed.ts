import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const hashed = (pw: string) => bcrypt.hash(pw, 10);

  await prisma.user.upsert({
    where: { email: "yamada@example.com" },
    update: {},
    create: {
      name: "山田 太郎",
      email: "yamada@example.com",
      password: await hashed("password123"),
      role: Role.sales,
      department: "営業部",
    },
  });

  await prisma.user.upsert({
    where: { email: "sato@example.com" },
    update: {},
    create: {
      name: "佐藤 花子",
      email: "sato@example.com",
      password: await hashed("password123"),
      role: Role.sales,
      department: "営業部",
    },
  });

  await prisma.user.upsert({
    where: { email: "suzuki@example.com" },
    update: {},
    create: {
      name: "鈴木 部長",
      email: "suzuki@example.com",
      password: await hashed("password123"),
      role: Role.manager,
      department: "営業部",
    },
  });

  await prisma.customer.createMany({
    skipDuplicates: true,
    data: [
      { companyName: "株式会社A", contactName: "田中 一郎", phone: "03-1111-1111" },
      { companyName: "株式会社B", contactName: "鈴木 二郎", phone: "06-2222-2222" },
      { companyName: "株式会社C", contactName: "佐藤 三郎", phone: "052-3333-3333" },
    ],
  });

  console.warn("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
