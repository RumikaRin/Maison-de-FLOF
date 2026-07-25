import { expect, test } from "@playwright/test";
import { P1_FIXTURES } from "../scripts/test-db-fixtures.ts";
import { createTestDatabase } from "../tests/integration/helpers/test-database.ts";

const database = createTestDatabase();
const quoteEmail = "integration-p1-abuse-quote@example.com";
const chatEmail = "integration-p1-abuse-chat@example.com";

async function cleanup() {
  await database.$transaction([
    database.quoteRequest.deleteMany({ where: { email: quoteEmail } }),
    database.chatMessage.deleteMany({ where: { email: chatEmail } }),
    database.notification.deleteMany({
      where: { message: { contains: P1_FIXTURES.namespace } },
    }),
  ]);
}

test.beforeEach(cleanup);
test.afterEach(cleanup);
test.afterAll(async () => database.$disconnect());

test("quote and guest chat writes enforce independent five-request windows", async ({
  request,
}) => {
  const quoteStatuses: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const response = await request.post("/api/quote-request", {
      headers: { "x-real-ip": "198.51.100.21" },
      data: {
        fullName: "P1 Abuse Quote",
        phone: "0901234567",
        email: quoteEmail,
        projectType: "Residential",
        message: `${P1_FIXTURES.namespace}quote ${index}`,
      },
    });
    quoteStatuses.push(response.status());
    if (index === 5) expect(response.headers()["retry-after"]).toBeTruthy();
  }
  expect(quoteStatuses).toEqual([201, 201, 201, 201, 201, 429]);

  const chatStatuses: number[] = [];
  for (let index = 0; index < 6; index += 1) {
    const response = await request.post("/api/chat", {
      headers: { "x-real-ip": "198.51.100.21" },
      data: {
        fullName: "P1 Abuse Chat",
        email: chatEmail,
        message: `${P1_FIXTURES.namespace}chat ${index}`,
        pageUrl: "/products",
      },
    });
    chatStatuses.push(response.status());
  }
  expect(chatStatuses).toEqual([201, 201, 201, 201, 201, 429]);
  expect(await database.quoteRequest.count({ where: { email: quoteEmail } })).toBe(
    5,
  );
  expect(await database.chatMessage.count({ where: { email: chatEmail } })).toBe(
    5,
  );
});
