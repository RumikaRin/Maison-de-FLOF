import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { TEST_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { assertTestDatabaseUrl } from "../scripts/assert-test-database.ts";

function createTestDatabase() {
  return new PrismaClient({
    datasourceUrl: assertTestDatabaseUrl(process.env.TEST_DATABASE_URL),
  });
}

async function signIn(
  page: Page,
  email: string = TEST_FIXTURES.customerEmail,
  destination: RegExp = /\/profile$/,
) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel(/Mật khẩu|Password/).fill(TEST_FIXTURES.password);
  await page.getByRole("button", { name: /Đăng nhập|Login/i }).click();
  await expect(page).toHaveURL(destination);
}

test("a user can revoke another owned session but not a foreign session", async ({
  browser,
}) => {
  const firstContext = await browser.newContext();
  const secondContext = await browser.newContext();
  const firstPage = await firstContext.newPage();
  const secondPage = await secondContext.newPage();

  const cleanupDatabase = createTestDatabase();
  try {
    const user = await cleanupDatabase.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.customerEmail },
      select: { id: true },
    });
    await cleanupDatabase.authSession.deleteMany({ where: { userId: user.id } });
  } finally {
    await cleanupDatabase.$disconnect();
  }

  await signIn(firstPage);
  await signIn(secondPage);

  const sessions = await firstPage.evaluate(async () => {
    const response = await fetch("/api/profile/sessions");
    return response.json();
  });
  expect(sessions).toHaveLength(2);
  const otherSession = sessions.find(
    (session: { current: boolean }) => !session.current,
  );
  expect(otherSession?.id).toBeTruthy();

  const database = createTestDatabase();
  let foreignSessionId = "";
  try {
    const foreignUser = await database.user.findUniqueOrThrow({
      where: { email: TEST_FIXTURES.resetEmail },
      select: { id: true },
    });
    const foreignSession = await database.authSession.create({
      data: {
        userId: foreignUser.id,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    foreignSessionId = foreignSession.id;
  } finally {
    await database.$disconnect();
  }

  const foreignAttempt = await firstPage.evaluate(async (id) => {
    const response = await fetch("/api/profile/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return response.status;
  }, foreignSessionId);
  expect(foreignAttempt).toBe(404);

  const revokeStatus = await firstPage.evaluate(async (id) => {
    const response = await fetch("/api/profile/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return response.status;
  }, otherSession.id);
  expect(revokeStatus).toBe(200);

  const revokedStatus = await secondPage.evaluate(async () => {
    const response = await fetch("/api/profile");
    return response.status;
  });
  expect(revokedStatus).toBe(401);

  const verificationDatabase = createTestDatabase();
  try {
    const foreignSession = await verificationDatabase.authSession.findUnique({
      where: { id: foreignSessionId },
      select: { revokedAt: true },
    });
    expect(foreignSession?.revokedAt).toBeNull();
  } finally {
    await verificationDatabase.authSession.deleteMany({
      where: { id: foreignSessionId },
    });
    await verificationDatabase.$disconnect();
    await firstContext.close();
    await secondContext.close();
  }
});

test("an admin role demotion invalidates the target session immediately", async ({
  browser,
}) => {
  const database = createTestDatabase();
  let targetUserId = "";
  let customerRoleId = "";
  try {
    const [target, adminRole, customerRole] = await Promise.all([
      database.user.findUniqueOrThrow({
        where: { email: TEST_FIXTURES.customerEmail },
        select: { id: true },
      }),
      database.role.findUniqueOrThrow({
        where: { type: "ADMIN" },
        select: { id: true },
      }),
      database.role.findUniqueOrThrow({
        where: { type: "CUSTOMER" },
        select: { id: true },
      }),
    ]);
    targetUserId = target.id;
    customerRoleId = customerRole.id;
    await database.user.update({
      where: { id: target.id },
      data: { roleId: adminRole.id },
    });
  } finally {
    await database.$disconnect();
  }

  const targetContext = await browser.newContext();
  const adminContext = await browser.newContext();
  const targetPage = await targetContext.newPage();
  const adminPage = await adminContext.newPage();

  try {
    await signIn(targetPage, TEST_FIXTURES.customerEmail, /\/admin$/);
    await signIn(adminPage, TEST_FIXTURES.adminEmail, /\/admin$/);

    const demotionStatus = await adminPage.evaluate(
      async ({ id }) => {
        const response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, role: "CUSTOMER" }),
        });
        return response.status;
      },
      { id: targetUserId },
    );
    expect(demotionStatus).toBe(200);

    const targetStatus = await targetPage.evaluate(async () => {
      const response = await fetch("/api/admin/dashboard");
      return response.status;
    });
    expect(targetStatus).toBe(401);
  } finally {
    const cleanupDatabase = createTestDatabase();
    try {
      await cleanupDatabase.user.update({
        where: { id: targetUserId },
        data: { roleId: customerRoleId },
      });
    } finally {
      await cleanupDatabase.$disconnect();
      await targetContext.close();
      await adminContext.close();
    }
  }
});
