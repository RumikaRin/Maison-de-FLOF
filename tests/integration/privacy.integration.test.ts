import assert from "node:assert/strict";
import test, { after, before, beforeEach } from "node:test";
import {
  applyPrivacyRetention,
  exportUserData,
  anonymizeUserData,
} from "../../src/services/privacy.service.ts";
import {
  loadTestFixtures,
  TEST_FIXTURES,
} from "../../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "./helpers/test-database.ts";

const database = createTestDatabase();
const userIds = new Set<string>();

async function cleanup() {
  const ids = [...userIds];
  if (ids.length === 0) return;
  const customers = await database.customer.findMany({
    where: { userId: { in: ids } },
    select: { id: true },
  });
  const customerIds = customers.map(({ id }) => id);
  const orders = await database.order.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true },
  });
  const orderIds = orders.map(({ id }) => id);

  await database.$transaction([
    database.auditLog.deleteMany({ where: { actorId: { in: ids } } }),
    database.orderStatusHistory.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.payment.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.checkoutIdempotency.deleteMany({ where: { orderId: { in: orderIds } } }),
    database.order.deleteMany({ where: { id: { in: orderIds } } }),
    database.address.deleteMany({ where: { userId: { in: ids } } }),
    database.notification.deleteMany({ where: { userId: { in: ids } } }),
    database.message.deleteMany({
      where: { conversation: { userId: { in: ids } } },
    }),
    database.conversation.deleteMany({ where: { userId: { in: ids } } }),
    database.authSession.deleteMany({ where: { userId: { in: ids } } }),
    database.session.deleteMany({ where: { userId: { in: ids } } }),
    database.account.deleteMany({ where: { userId: { in: ids } } }),
    database.wishlist.deleteMany({
      where: { customerId: { in: customerIds } },
    }),
    database.wishlistColor.deleteMany({
      where: { customerId: { in: customerIds } },
    }),
    database.quoteRequest.deleteMany({
      where: { customerId: { in: customerIds } },
    }),
    database.customer.deleteMany({ where: { id: { in: customerIds } } }),
    database.user.deleteMany({ where: { id: { in: ids } } }),
  ]);
  userIds.clear();
}

async function createPrivacyUser() {
  const role = await database.role.findUniqueOrThrow({
    where: { type: "CUSTOMER" },
  });
  const paint = await database.paint.findUniqueOrThrow({
    where: { sku: TEST_FIXTURES.productSku },
  });
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const user = await database.user.create({
    data: {
      email: `privacy-integration-${suffix}@flof.test`,
      name: "Privacy Integration User",
      phone: "0900000000",
      password: "secret-password-hash",
      privacyConsentAt: new Date(),
      roleId: role.id,
      customer: {
        create: {
          customerType: "RETAIL",
          companyName: "Privacy Company",
          taxCode: "PRIVACY-TAX",
        },
      },
      addresses: {
        create: {
          fullName: "Privacy Integration User",
          phone: "0900000000",
          addressLine1: "1 Privacy Street",
          district: "District",
          province: "Province",
        },
      },
      notifications: {
        create: {
          type: "SYSTEM",
          title: "Private notification",
          message: "Contains customer context",
        },
      },
      authSessions: {
        create: {
          expiresAt: new Date(Date.now() + 86_400_000),
          userAgentHash: "safe-hash",
        },
      },
      accounts: {
        create: {
          type: "oauth",
          provider: "integration",
          providerAccountId: suffix,
          access_token: "provider-access-secret",
          refresh_token: "provider-refresh-secret",
        },
      },
      conversation: {
        create: {
          messages: {
            create: {
              senderId: "customer",
              content: "Private authenticated chat",
            },
          },
        },
      },
    },
    include: { customer: true, addresses: true },
  });
  userIds.add(user.id);

  const order = await database.order.create({
    data: {
      orderNumber: `PRIVACY-INTEGRATION-${suffix}`,
      customerId: user.customer!.id,
      addressId: user.addresses[0].id,
      status: "COMPLETED",
      subtotal: 500000,
      total: 500000,
      shippingName: user.name,
      shippingPhone: user.phone,
      shippingEmail: user.email,
      shippingAddress: "1 Privacy Street",
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
  return { user, order };
}

before(async () => {
  await loadTestFixtures();
});

beforeEach(cleanup);
after(async () => {
  await cleanup();
  await database.chatMessage.deleteMany({
    where: { fullName: "Privacy retention guest" },
  });
  await database.$disconnect();
});

test("owner export includes customer records but excludes credentials and provider tokens", async () => {
  const { user, order } = await createPrivacyUser();
  const exported = await exportUserData(database, user.id);
  const serialized = JSON.stringify(exported);

  assert.equal(exported.profile.email, user.email);
  assert.ok(exported.orders.some((entry) => entry.id === order.id));
  assert.doesNotMatch(
    serialized,
    /secret-password-hash|provider-access-secret|provider-refresh-secret/,
  );
  assert.doesNotMatch(serialized, /access_token|refresh_token|sessionToken/);
});

test("deletion anonymizes PII and revokes access while retaining order and audit facts", async () => {
  const { user, order } = await createPrivacyUser();
  await anonymizeUserData(database, user.id);

  const [anonymized, retainedOrder, audit] = await Promise.all([
    database.user.findUniqueOrThrow({ where: { id: user.id } }),
    database.order.findUniqueOrThrow({ where: { id: order.id } }),
    database.auditLog.findFirstOrThrow({
      where: { actorId: user.id, action: "ACCOUNT_ANONYMIZED" },
    }),
  ]);
  assert.match(anonymized.email, /^deleted\+[a-f0-9]{24}@privacy\.invalid$/);
  assert.equal(anonymized.name, null);
  assert.equal(anonymized.phone, null);
  assert.equal(anonymized.password, null);
  assert.ok(anonymized.deletionRequestedAt);
  assert.equal(retainedOrder.total.toString(), "500000");
  assert.equal(retainedOrder.shippingEmail, null);
  assert.equal(await database.address.count({ where: { userId: user.id } }), 0);
  assert.equal(await database.authSession.count({ where: { userId: user.id } }), 0);
  assert.equal(await database.account.count({ where: { userId: user.id } }), 0);
  assert.equal(await database.conversation.count({ where: { userId: user.id } }), 0);
  assert.match(audit.actorEmail, /@privacy\.invalid$/);
});

test("retention removes expired transient data and is idempotent", async () => {
  const { user } = await createPrivacyUser();
  const old = new Date("2024-01-01T00:00:00.000Z");
  await database.verificationToken.create({
    data: {
      identifier: `reset:${user.email}`,
      token: `privacy-expired-${user.id}`,
      expires: old,
    },
  });
  await database.session.create({
    data: {
      userId: user.id,
      sessionToken: `privacy-session-${user.id}`,
      expires: old,
    },
  });
  await database.chatMessage.create({
    data: {
      fullName: "Privacy retention guest",
      email: "privacy-retention@example.com",
      message: "Old consented contact request",
      consentAt: old,
      createdAt: old,
      updatedAt: old,
    },
  });

  const now = new Date("2026-07-26T00:00:00.000Z");
  const first = await applyPrivacyRetention(database, now);
  const second = await applyPrivacyRetention(database, now);

  assert.ok(first.verificationTokens > 0);
  assert.ok(first.sessions > 0);
  assert.ok(first.guestChats > 0);
  assert.deepEqual(second, {
    verificationTokens: 0,
    sessions: 0,
    authSessions: 0,
    guestChats: 0,
    notifications: 0,
  });
});
