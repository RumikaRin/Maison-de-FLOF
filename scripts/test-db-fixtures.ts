import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { assertTestDatabaseUrl } from "./assert-test-database.ts";
import { isMainModule } from "./is-main-module.ts";

export const TEST_FIXTURES = {
  customerEmail: "customer.integration@flof.test",
  resetEmail: "reset.integration@flof.test",
  adminEmail: "admin.integration@flof.test",
  password: "Flof-Test-2026!",
  productSku: "FLOF-INTEGRATION-5L",
  productSlug: "flof-integration-paint-5l",
  couponCode: "INTEGRATION10",
} as const;

export async function loadTestFixtures(databaseUrl = process.env.TEST_DATABASE_URL) {
  const datasourceUrl = assertTestDatabaseUrl(databaseUrl);
  const database = new PrismaClient({ datasourceUrl });

  try {
    const password = await bcrypt.hash(TEST_FIXTURES.password, 12);
    const [customerRole, adminRole] = await Promise.all([
      database.role.upsert({
        where: { type: "CUSTOMER" },
        update: { name: "Customer" },
        create: { name: "Customer", type: "CUSTOMER" },
      }),
      database.role.upsert({
        where: { type: "ADMIN" },
        update: { name: "Administrator" },
        create: { name: "Administrator", type: "ADMIN" },
      }),
    ]);

    const [customerUser, resetUser, adminUser] = await Promise.all([
      database.user.upsert({
        where: { email: TEST_FIXTURES.customerEmail },
        update: {
          password,
          name: "Integration Customer",
          roleId: customerRole.id,
        },
        create: {
          email: TEST_FIXTURES.customerEmail,
          password,
          name: "Integration Customer",
          roleId: customerRole.id,
        },
      }),
      database.user.upsert({
        where: { email: TEST_FIXTURES.resetEmail },
        update: {
          password,
          name: "Reset Integration Customer",
          roleId: customerRole.id,
        },
        create: {
          email: TEST_FIXTURES.resetEmail,
          password,
          name: "Reset Integration Customer",
          roleId: customerRole.id,
        },
      }),
      database.user.upsert({
        where: { email: TEST_FIXTURES.adminEmail },
        update: {
          password,
          name: "Integration Admin",
          roleId: adminRole.id,
        },
        create: {
          email: TEST_FIXTURES.adminEmail,
          password,
          name: "Integration Admin",
          roleId: adminRole.id,
        },
      }),
    ]);

    await Promise.all([
      database.customer.upsert({
        where: { userId: customerUser.id },
        update: {},
        create: { userId: customerUser.id },
      }),
      database.customer.upsert({
        where: { userId: resetUser.id },
        update: {},
        create: { userId: resetUser.id },
      }),
    ]);

    const category = await database.category.upsert({
      where: { slug: "integration-paints" },
      update: { name: "Integration Paints", isActive: true },
      create: {
        name: "Integration Paints",
        slug: "integration-paints",
        isActive: true,
      },
    });
    const supplier = await database.supplier.upsert({
      where: { slug: "flof-integration" },
      update: { name: "FLOF Integration", isActive: true },
      create: {
        name: "FLOF Integration",
        slug: "flof-integration",
        isActive: true,
      },
    });
    const paint = await database.paint.upsert({
      where: { sku: TEST_FIXTURES.productSku },
      update: {
        name: "FLOF Integration Paint 5L",
        slug: TEST_FIXTURES.productSlug,
        categoryId: category.id,
        supplierId: supplier.id,
        paintType: "INTERIOR",
        finish: "MATTE",
        surfaces: ["WALL"],
        volume: 5,
        price: 500000,
        costPrice: 300000,
        stock: 20,
        minStock: 5,
        images: ["/product_interior.webp"],
        isActive: true,
      },
      create: {
        sku: TEST_FIXTURES.productSku,
        name: "FLOF Integration Paint 5L",
        slug: TEST_FIXTURES.productSlug,
        categoryId: category.id,
        supplierId: supplier.id,
        paintType: "INTERIOR",
        finish: "MATTE",
        surfaces: ["WALL"],
        volume: 5,
        price: 500000,
        costPrice: 300000,
        stock: 20,
        minStock: 5,
        images: ["/product_interior.webp"],
        isActive: true,
      },
    });

    await database.coupon.upsert({
      where: { code: TEST_FIXTURES.couponCode },
      update: {
        type: "PERCENTAGE",
        value: 10,
        minSpend: 0,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2030-01-01T00:00:00.000Z"),
        usageLimit: 1000,
        usageCount: 0,
        isActive: true,
      },
      create: {
        code: TEST_FIXTURES.couponCode,
        type: "PERCENTAGE",
        value: 10,
        minSpend: 0,
        startDate: new Date("2026-01-01T00:00:00.000Z"),
        endDate: new Date("2030-01-01T00:00:00.000Z"),
        usageLimit: 1000,
        isActive: true,
      },
    });

    return {
      customerUser,
      resetUser,
      adminUser,
      paint,
    };
  } finally {
    await database.$disconnect();
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  await loadTestFixtures();
  console.log("Test fixtures loaded");
}
