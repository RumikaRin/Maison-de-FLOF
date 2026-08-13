import { expect, test } from "@playwright/test";
import {
  createTestDatabase,
  resetHttpApiFixtures,
} from "../tests/integration/helpers/test-database.ts";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { login, loginAsAdmin, loginAsCustomer } from "./helpers/auth.ts";

const database = createTestDatabase();

test.beforeEach(async () => {
  await resetHttpApiFixtures(database);
});

test.afterEach(async () => {
  await resetHttpApiFixtures(database);
});

test.afterAll(async () => {
  await resetHttpApiFixtures(database);
  await database.$disconnect();
});

test("HTTP fixture cleanup is namespaced", async () => {
  await database.category.create({
    data: {
      name: "HTTP cleanup fixture",
      slug: "integration-http-cleanup",
    },
  });

  await resetHttpApiFixtures(database);

  await expect(
    database.category.findUnique({
      where: { slug: "integration-http-cleanup" },
    }),
  ).resolves.toBeNull();
  await expect(
    database.category.findUnique({
      where: { slug: "integration-paints" },
    }),
  ).resolves.not.toBeNull();
});

test("ADMIN can manage a category through HTTP with audit history", async ({
  page,
}) => {
  const slug = `integration-http-category-${Date.now()}`;
  const category = {
    name: "HTTP Category",
    nameEn: "HTTP Category",
    slug,
    description: "Created through authenticated HTTP E2E",
    image: "",
    sortOrder: 25,
    isActive: true,
  };

  await loginAsAdmin(page);
  const createdResponse = await page.request.post("/api/admin/categories", {
    data: category,
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as { id: string };

  const duplicateResponse = await page.request.post("/api/admin/categories", {
    data: category,
  });
  expect(duplicateResponse.status()).toBe(409);

  const updatedResponse = await page.request.patch("/api/admin/categories", {
    data: {
      ...category,
      id: created.id,
      name: "HTTP Category Updated",
      sortOrder: 30,
    },
  });
  expect(updatedResponse.status()).toBe(200);

  const deletedResponse = await page.request.delete(
    `/api/admin/categories?id=${encodeURIComponent(created.id)}`,
  );
  expect(deletedResponse.status()).toBe(200);

  await expect(
    database.category.findUnique({
      where: { id: created.id },
      select: { isActive: true },
    }),
  ).resolves.toEqual({ isActive: false });
  await expect(
    database.auditLog.findMany({
      where: { entityType: "Category", entityId: created.id },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    }),
  ).resolves.toEqual([
    { action: "CATEGORY_CREATED" },
    { action: "CATEGORY_UPDATED" },
    { action: "CATEGORY_DEACTIVATED" },
  ]);
});

test("CUSTOMER is denied admin catalog mutations", async ({ page }) => {
  const slug = `integration-http-denied-${Date.now()}`;

  await loginAsCustomer(page);
  const response = await page.request.post("/api/admin/categories", {
    data: {
      name: "Denied HTTP Category",
      nameEn: "",
      slug,
      description: "",
      image: "",
      sortOrder: 0,
      isActive: true,
    },
  });

  expect(response.status()).toBe(403);
  await expect(
    database.category.findUnique({ where: { slug } }),
  ).resolves.toBeNull();
});

test("a customer without a completed purchase cannot submit a review", async ({
  page,
}) => {
  const paint = await database.paint.findUniqueOrThrow({
    where: { sku: TEST_FIXTURES.productSku },
    select: { id: true },
  });
  const comment = `integration-http-review-${Date.now()}`;

  await login(page, TEST_FIXTURES.resetEmail, /\/profile$/);
  const response = await page.request.post("/api/reviews", {
    data: {
      paintId: paint.id,
      rating: 5,
      comment,
    },
  });

  expect(response.status()).toBe(403);
  await expect(
    database.review.findFirst({ where: { comment } }),
  ).resolves.toBeNull();
});

test("a public quote can be created and advanced by ADMIN", async ({ page }) => {
  const email = `integration-http-quote-${Date.now()}@flof.test`;
  const createdResponse = await page.request.post("/api/quote-request", {
    data: {
      fullName: "HTTP Quote Customer",
      phone: "0900000000",
      email,
      companyName: "FLOF HTTP Test",
      projectName: "Contract verification",
      projectType: "Residential",
      area: 120,
      paintType: "Interior",
      message: "integration-http-quote created through public HTTP",
    },
  });
  expect(createdResponse.status()).toBe(201);
  const created = (await createdResponse.json()) as {
    data: { id: string };
  };

  await loginAsAdmin(page);
  const updatedResponse = await page.request.patch("/api/admin/quotes", {
    data: {
      id: created.data.id,
      status: "CONTACTED",
      adminNote: "Verified by HTTP E2E",
    },
  });
  expect(updatedResponse.status()).toBe(200);

  await expect(
    database.quoteRequest.findUnique({
      where: { id: created.data.id },
      select: { status: true, adminNote: true },
    }),
  ).resolves.toEqual({
    status: "CONTACTED",
    adminNote: "Verified by HTTP E2E",
  });
  await expect(
    database.auditLog.count({
      where: {
        entityType: "QuoteRequest",
        entityId: created.data.id,
        action: "QUOTE_STATUS_CHANGED",
      },
    }),
  ).resolves.toBe(1);
});

test("customer and ADMIN can complete a support conversation through HTTP", async ({
  page,
}) => {
  const customerContent = `integration-http-chat-customer-${Date.now()}`;
  const adminContent = `integration-http-chat-admin-${Date.now()}`;

  await loginAsCustomer(page);
  const customerResponse = await page.request.post("/api/chat/conversation", {
    data: { content: customerContent },
  });
  expect(customerResponse.status()).toBe(201);
  const customerPayload = (await customerResponse.json()) as {
    message: { conversationId: string };
  };
  const conversationId = customerPayload.message.conversationId;

  const conversationResponse = await page.request.get(
    "/api/chat/conversation",
  );
  expect(conversationResponse.status()).toBe(200);
  const customerConversation = (await conversationResponse.json()) as {
    id: string;
    messages: Array<{ content: string; isAdmin: boolean }>;
  };
  expect(customerConversation.id).toBe(conversationId);
  expect(customerConversation.messages).toEqual([
    expect.objectContaining({
      content: customerContent,
      isAdmin: false,
    }),
  ]);

  const resetUser = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.resetEmail },
    select: { id: true },
  });
  await expect(
    database.conversation.findUnique({
      where: { userId: resetUser.id },
    }),
  ).resolves.toBeNull();

  await page.context().clearCookies();
  await loginAsAdmin(page);
  const replyResponse = await page.request.post(
    "/api/admin/chat/conversations",
    {
      data: {
        conversationId,
        content: adminContent,
      },
    },
  );
  expect(replyResponse.status()).toBe(201);
  const replyPayload = (await replyResponse.json()) as {
    message: { isAdmin: boolean; content: string };
  };
  expect(replyPayload.message).toMatchObject({
    isAdmin: true,
    content: adminContent,
  });

  const staffReadResponse = await page.request.get(
    `/api/admin/chat/conversations/${encodeURIComponent(conversationId)}`,
  );
  expect(staffReadResponse.status()).toBe(200);
  const staffConversation = (await staffReadResponse.json()) as {
    messages: Array<{ content: string; isAdmin: boolean; isRead: boolean }>;
  };
  expect(staffConversation.messages).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        content: customerContent,
        isAdmin: false,
        isRead: true,
      }),
      expect.objectContaining({
        content: adminContent,
        isAdmin: true,
      }),
    ]),
  );
  await expect(
    database.auditLog.findMany({
      where: { entityType: "Conversation", entityId: conversationId },
      orderBy: { createdAt: "asc" },
      select: { action: true },
    }),
  ).resolves.toEqual([
    { action: "CHAT_REPLY_SENT" },
    { action: "CHAT_CONVERSATION_READ" },
  ]);
});
