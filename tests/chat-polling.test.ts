import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateNextChatDelay,
  getConversationLastModified,
  isNotModified,
  CHAT_POLL_INITIAL_DELAY,
  CHAT_POLL_MAX_DELAY,
} from "../src/lib/chat/polling.ts";

test("calculateNextChatDelay backs off on not_modified and caps at 30000ms", () => {
  let delay = CHAT_POLL_INITIAL_DELAY;
  assert.equal(delay, 3000);

  delay = calculateNextChatDelay(delay, "not_modified");
  assert.equal(delay, 5400);

  delay = calculateNextChatDelay(delay, "not_modified");
  assert.equal(delay, 9720);

  delay = calculateNextChatDelay(delay, "not_modified");
  assert.equal(delay, 17496);

  delay = calculateNextChatDelay(delay, "not_modified");
  assert.equal(delay, CHAT_POLL_MAX_DELAY);

  // Stays capped
  delay = calculateNextChatDelay(delay, "not_modified");
  assert.equal(delay, CHAT_POLL_MAX_DELAY);
});

test("calculateNextChatDelay resets to 3000ms on modified response", () => {
  assert.equal(calculateNextChatDelay(30000, "modified"), 3000);
  assert.equal(calculateNextChatDelay(17496, "modified"), 3000);
  assert.equal(calculateNextChatDelay(5400, "modified"), 3000);
});

test("calculateNextChatDelay handles error with safe floor and ceiling", () => {
  assert.equal(calculateNextChatDelay(3000, "error"), 10000);
  assert.equal(calculateNextChatDelay(10000, "error"), 18000);
  assert.equal(calculateNextChatDelay(18000, "error"), CHAT_POLL_MAX_DELAY);
  assert.equal(calculateNextChatDelay(30000, "error"), CHAT_POLL_MAX_DELAY);
});

test("getConversationLastModified computes correct second-floored timestamps", () => {
  // Null conversation returns epoch
  assert.equal(getConversationLastModified(null).getTime(), 0);

  // Conversation with updatedAt only
  const d1 = new Date("2026-09-05T12:00:00.789Z");
  const result1 = getConversationLastModified({
    updatedAt: d1,
    messages: [],
  });
  assert.equal(result1.getTime(), new Date("2026-09-05T12:00:00.000Z").getTime());

  // Conversation with newer message
  const d2 = new Date("2026-09-05T12:05:30.456Z");
  const result2 = getConversationLastModified({
    updatedAt: d1,
    messages: [
      { createdAt: new Date("2026-09-05T12:01:00.000Z") },
      { createdAt: d2 },
    ],
  });
  assert.equal(result2.getTime(), new Date("2026-09-05T12:05:30.000Z").getTime());

  // Conversation with updatedAt newer than messages
  const d3 = new Date("2026-09-05T12:10:00.123Z");
  const result3 = getConversationLastModified({
    updatedAt: d3,
    messages: [
      { createdAt: d2 },
    ],
  });
  assert.equal(result3.getTime(), new Date("2026-09-05T12:10:00.000Z").getTime());
});

test("isNotModified evaluates HTTP conditional header correctly", () => {
  const lastModified = new Date("2026-09-05T12:00:00.000Z").getTime();
  const lastModifiedUtc = new Date(lastModified).toUTCString();

  // Missing or empty header
  assert.equal(isNotModified(lastModified, null), false);
  assert.equal(isNotModified(lastModified, ""), false);

  // Invalid date format
  assert.equal(isNotModified(lastModified, "invalid-date-format"), false);

  // Exact match
  assert.equal(isNotModified(lastModified, lastModifiedUtc), true);

  // Header is more recent than server state
  const laterDateUtc = new Date("2026-09-05T12:01:00.000Z").toUTCString();
  assert.equal(isNotModified(lastModified, laterDateUtc), true);

  // Header is older than server state (client has stale cache)
  const earlierDateUtc = new Date("2026-09-05T11:59:00.000Z").toUTCString();
  assert.equal(isNotModified(lastModified, earlierDateUtc), false);
});
