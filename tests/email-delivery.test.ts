import test from "node:test";
import assert from "node:assert/strict";
import {
  createEmailSender,
  EmailDeliveryError,
} from "../src/lib/email-delivery.ts";

test("email sender fails when provider configuration is missing", async () => {
  const send = createEmailSender(null, undefined);

  await assert.rejects(
    () =>
      send({
        to: "user@example.com",
        subject: "Subject",
        html: "<p>Body</p>",
      }),
    (error) =>
      error instanceof EmailDeliveryError &&
      error.code === "NOT_CONFIGURED",
  );
});

test("email sender reports a sanitized provider failure", async () => {
  const send = createEmailSender(
    {
      send: async () => {
        throw new Error("provider-secret-detail");
      },
    },
    "FLOF <noreply@example.com>",
  );

  await assert.rejects(
    () =>
      send({
        to: "user@example.com",
        subject: "Subject",
        html: "<p>Body</p>",
      }),
    (error) =>
      error instanceof EmailDeliveryError &&
      error.code === "PROVIDER_ERROR" &&
      !error.message.includes("provider-secret-detail"),
  );
});

test("email sender resolves only after the provider accepts the message", async () => {
  const delivered: Array<Record<string, string>> = [];
  const send = createEmailSender(
    {
      send: async (message) => {
        delivered.push(message);
      },
    },
    "FLOF <noreply@example.com>",
  );

  await send({
    to: "user@example.com",
    subject: "Subject",
    html: "<p>Body</p>",
  });

  assert.deepEqual(delivered, [
    {
      from: "FLOF <noreply@example.com>",
      to: "user@example.com",
      subject: "Subject",
      html: "<p>Body</p>",
    },
  ]);
});
