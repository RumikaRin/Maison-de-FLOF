import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import {
  loadTestFixtures,
  TEST_FIXTURES,
} from "../../scripts/test-db-fixtures.ts";
import { ApiError } from "../../src/lib/api-auth.ts";
import {
  appendCustomerMessage,
  appendStaffMessage,
  createQuoteRequest,
  deleteReview,
  getConversationForUser,
  readConversationAsStaff,
  replyToReview,
  submitVerifiedReview,
  updateQuoteRequest,
} from "../../src/lib/customer-workflow-service.ts";
import {
  createTestDatabase,
  resetCustomerWorkflowFixtures,
} from "./helpers/test-database.ts";

const database = createTestDatabase();

before(async () => {
  await loadTestFixtures();
});

beforeEach(async () => {
  await resetCustomerWorkflowFixtures(database);
});

after(async () => {
  await resetCustomerWorkflowFixtures(database);
  await database.$disconnect();
});

test("workflow cleanup removes only namespaced quote fixtures", async () => {
  await database.quoteRequest.create({
    data: {
      fullName: "Integration workflow cleanup",
      phone: "0900000000",
      email: "integration-workflow-cleanup@flof.test",
      projectType: "Residential",
      message: "integration-workflow-cleanup quote",
    },
  });

  await resetCustomerWorkflowFixtures(database);

  assert.equal(
    await database.quoteRequest.count({
      where: { email: "integration-workflow-cleanup@flof.test" },
    }),
    0,
  );
});

test("review lifecycle enforces purchase ownership, upserts and audits staff actions", async () => {
  const [customerUser, resetUser, admin, paint] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
    }),
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.resetEmail },
    }),
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.adminEmail },
    }),
    database.paint.findUniqueOrThrow({
      where: { sku: TEST_FIXTURES.productSku },
    }),
  ]);
  const customer = await database.customer.findUniqueOrThrow({
    where: { userId: customerUser.id },
  });
  await database.order.create({
    data: {
      orderNumber: "INTEGRATION-WORKFLOW-REVIEW",
      customerId: customer.id,
      status: "COMPLETED",
      subtotal: 500000,
      total: 500000,
      items: {
        create: {
          paintId: paint.id,
          productName: paint.name,
          productSku: paint.sku,
          quantity: 1,
          price: 500000,
          total: 500000,
        },
      },
    },
  });

  const created = await submitVerifiedReview(database, customerUser.id, {
    paintId: paint.id,
    rating: 4,
    comment: "integration-workflow-review initial",
  });
  assert.equal(created.rating, 4);
  assert.equal(
    await database.notification.count({
      where: { userId: admin.id, type: "REVIEW" },
    }),
    1,
  );

  const updated = await submitVerifiedReview(database, customerUser.id, {
    paintId: paint.id,
    rating: 5,
    comment: "integration-workflow-review updated",
  });
  assert.equal(updated.rating, 5);
  assert.equal(
    await database.review.count({
      where: { paintId: paint.id, userId: customerUser.id },
    }),
    1,
  );

  await assert.rejects(
    () =>
      submitVerifiedReview(database, resetUser.id, {
        paintId: paint.id,
        rating: 3,
        comment: "integration-workflow-review unauthorized",
      }),
    (error: unknown) => error instanceof ApiError && error.status === 403,
  );

  const actor = { id: admin.id, email: admin.email };
  const replied = await replyToReview(database, actor, {
    id: updated.id,
    adminReply: "Cảm ơn bạn đã đánh giá.",
  });
  assert.equal(replied.adminReply, "Cảm ơn bạn đã đánh giá.");
  await deleteReview(database, actor, updated.id);
  assert.equal(await database.review.count({ where: { id: updated.id } }), 0);
  assert.equal(
    await database.auditLog.count({
      where: {
        entityId: updated.id,
        action: { in: ["REVIEW_REPLIED", "REVIEW_DELETED"] },
      },
    }),
    2,
  );
});

test("quote lifecycle creates notifications and audits staff status changes", async () => {
  const admin = await database.user.findUniqueOrThrow({
    where: { email: TEST_FIXTURES.adminEmail },
  });
  const created = await createQuoteRequest(database, null, {
    fullName: "Integration Workflow Quote",
    phone: "0900000000",
    email: "integration-workflow-quote@flof.test",
    companyName: null,
    projectName: "Integration project",
    projectType: "Residential",
    area: 120,
    paintType: "Interior",
    message: "integration-workflow-quote request",
  });

  assert.equal(created.status, "PENDING");
  assert.equal(
    await database.notification.count({
      where: { userId: admin.id, type: "QUOTE" },
    }),
    1,
  );

  const updated = await updateQuoteRequest(
    database,
    { id: admin.id, email: admin.email },
    {
      id: created.id,
      status: "CONTACTED",
      adminNote: "Đã gọi xác nhận",
    },
  );
  assert.equal(updated.status, "CONTACTED");
  assert.equal(updated.adminNote, "Đã gọi xác nhận");
  assert.equal(
    await database.auditLog.count({
      where: { entityId: created.id, action: "QUOTE_STATUS_CHANGED" },
    }),
    1,
  );
});

test("conversation lifecycle scopes customers and audits staff replies", async () => {
  const [customer, anotherCustomer, admin] = await Promise.all([
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
    }),
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.resetEmail },
    }),
    database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.adminEmail },
    }),
  ]);

  const first = await appendCustomerMessage(database, customer, {
    content: "integration-workflow-chat first",
  });
  assert.equal(first.message.isAdmin, false);
  assert.equal(
    await database.notification.count({
      where: { userId: admin.id, type: "SYSTEM" },
    }),
    1,
  );

  await database.conversation.update({
    where: { id: first.conversation.id },
    data: { status: "CLOSED" },
  });
  const second = await appendCustomerMessage(database, customer, {
    content: "integration-workflow-chat second",
  });
  assert.equal(second.conversation.id, first.conversation.id);
  assert.equal(second.conversation.status, "IN_PROGRESS");

  const ownConversation = await getConversationForUser(database, customer.id);
  const otherConversation = await getConversationForUser(
    database,
    anotherCustomer.id,
  );
  assert.equal(ownConversation?.messages.length, 2);
  assert.equal(otherConversation, null);

  const actor = { id: admin.id, email: admin.email };
  const reply = await appendStaffMessage(
    database,
    actor,
    first.conversation.id,
    "integration-workflow-chat staff reply",
  );
  assert.equal(reply.isAdmin, true);
  const read = await readConversationAsStaff(
    database,
    actor,
    first.conversation.id,
  );
  assert.equal(
    read.messages.filter((message) => !message.isAdmin && !message.isRead)
      .length,
    0,
  );
  assert.equal(
    await database.auditLog.count({
      where: {
        entityId: first.conversation.id,
        action: { in: ["CHAT_REPLY_SENT", "CHAT_CONVERSATION_READ"] },
      },
    }),
    2,
  );
});
