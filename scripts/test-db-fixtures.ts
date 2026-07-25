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

export const P1_FIXTURES = {
  namespace: "integration-p1-",
  customerTwoEmail: "integration-p1-customer-two@example.com",
  loadAccountEmail: "integration-p1-load@example.com",
  supplierSlug: "integration-p1-supplier",
  collectionSlug: "integration-p1-collection",
  colorCode: "integration-p1-color",
  productSku: "INTEGRATION-P1-PAINT-5L",
  productSlug: "integration-p1-paint-5l",
  articleSlug: "integration-p1-article",
  orderNumberPrefix: "INTEGRATION-P1-",
  idempotencyPrefix: "integration-p1-",
  addressLabel: "integration-p1-address",
  password: TEST_FIXTURES.password,
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

    const [customerUser, resetUser, adminUser, customerTwoUser, loadUser] = await Promise.all([
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
      database.user.upsert({
        where: { email: P1_FIXTURES.customerTwoEmail },
        update: { password, name: "P1 Customer Two", roleId: customerRole.id },
        create: {
          email: P1_FIXTURES.customerTwoEmail,
          password,
          name: "P1 Customer Two",
          roleId: customerRole.id,
        },
      }),
      database.user.upsert({
        where: { email: P1_FIXTURES.loadAccountEmail },
        update: { password, name: "P1 Load Account", roleId: customerRole.id },
        create: {
          email: P1_FIXTURES.loadAccountEmail,
          password,
          name: "P1 Load Account",
          roleId: customerRole.id,
        },
      }),
    ]);
    await database.role.upsert({
      where: { type: "STAFF" },
      update: { name: "Staff" },
      create: { name: "Staff", type: "STAFF" },
    });

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
      database.customer.upsert({
        where: { userId: customerTwoUser.id },
        update: {},
        create: { userId: customerTwoUser.id },
      }),
      database.customer.upsert({
        where: { userId: loadUser.id },
        update: {},
        create: { userId: loadUser.id },
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

    const p1Supplier = await database.supplier.upsert({
      where: { slug: P1_FIXTURES.supplierSlug },
      update: { name: "P1 Supplier", isActive: true },
      create: {
        name: "P1 Supplier",
        slug: P1_FIXTURES.supplierSlug,
        isActive: true,
      },
    });
    const p1Collection = await database.colorCollection.upsert({
      where: { slug: P1_FIXTURES.collectionSlug },
      update: { name: "P1 Collection", year: 2026, isActive: true },
      create: {
        name: "P1 Collection",
        slug: P1_FIXTURES.collectionSlug,
        year: 2026,
        isActive: true,
      },
    });
    const p1Color = await database.paintColor.upsert({
      where: { code: P1_FIXTURES.colorCode },
      update: {
        name: "P1 Blue",
        hex: "#315B7D",
        toneFamily: "COOL",
        colorFamily: "BLUE",
        collectionId: p1Collection.id,
      },
      create: {
        code: P1_FIXTURES.colorCode,
        name: "P1 Blue",
        hex: "#315B7D",
        toneFamily: "COOL",
        colorFamily: "BLUE",
        collectionId: p1Collection.id,
      },
    });
    const p1Paint = await database.paint.upsert({
      where: { sku: P1_FIXTURES.productSku },
      update: {
        name: "P1 Paint 5L",
        slug: P1_FIXTURES.productSlug,
        categoryId: category.id,
        supplierId: p1Supplier.id,
        paintType: "INTERIOR",
        finish: "MATTE",
        surfaces: ["WALL"],
        volume: 5,
        price: 550000,
        costPrice: 320000,
        stock: 20,
        minStock: 5,
        images: ["/product_interior.webp"],
        isActive: true,
      },
      create: {
        sku: P1_FIXTURES.productSku,
        name: "P1 Paint 5L",
        slug: P1_FIXTURES.productSlug,
        categoryId: category.id,
        supplierId: p1Supplier.id,
        paintType: "INTERIOR",
        finish: "MATTE",
        surfaces: ["WALL"],
        volume: 5,
        price: 550000,
        costPrice: 320000,
        stock: 20,
        minStock: 5,
        images: ["/product_interior.webp"],
        isActive: true,
      },
    });
    await database.paintColorLink.upsert({
      where: {
        paintId_colorId: { paintId: p1Paint.id, colorId: p1Color.id },
      },
      update: {},
      create: { paintId: p1Paint.id, colorId: p1Color.id },
    });
    await database.blog.upsert({
      where: { slug: P1_FIXTURES.articleSlug },
      update: {
        title: "P1 Integration Article",
        summary: "P1 integration summary",
        content: "P1 integration content",
        authorId: adminUser.id,
        isActive: true,
      },
      create: {
        title: "P1 Integration Article",
        slug: P1_FIXTURES.articleSlug,
        summary: "P1 integration summary",
        content: "P1 integration content",
        authorId: adminUser.id,
        isActive: true,
      },
    });

    return {
      customerUser,
      resetUser,
      adminUser,
      customerTwoUser,
      loadUser,
      paint,
      p1Paint,
      p1Color,
    };
  } finally {
    await database.$disconnect();
  }
}

if (isMainModule(import.meta.url, process.argv[1])) {
  await loadTestFixtures();
  console.log("Test fixtures loaded");
}
