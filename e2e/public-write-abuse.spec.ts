import { expect, test } from "@playwright/test";

test("public write abuse receives the stable rate-limit envelope", async ({
  request,
}) => {
  const statuses: number[] = [];
  let limitedResponse: Awaited<ReturnType<typeof request.post>> | null = null;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await request.post("/api/quote-request", {
      data: {},
    });
    statuses.push(response.status());
    if (response.status() === 429) limitedResponse = response;
  }

  expect(statuses.slice(0, 5)).not.toContain(429);
  expect(statuses[5]).toBe(429);
  expect(limitedResponse).not.toBeNull();
  const body = await limitedResponse!.json();
  expect(body.error).toMatchObject({
    code: "RATE_LIMITED",
  });
  expect(body.requestId).toBeTruthy();
  expect(limitedResponse!.headers()["x-request-id"]).toBe(body.requestId);
  expect(Number(limitedResponse!.headers()["retry-after"])).toBeGreaterThanOrEqual(
    0,
  );
});
