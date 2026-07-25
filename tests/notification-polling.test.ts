import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNotificationEtag,
  createNotificationPoller,
  notificationPollHeaders,
} from "../src/lib/notifications/polling.ts";

const flush = () => new Promise((resolve) => setImmediate(resolve));

test("polling uses one in-flight request and pauses while inactive", async () => {
  let resolvePoll!: () => void;
  let calls = 0;
  const scheduled: Array<{ callback: () => void; delay: number }> = [];
  const cancelled: unknown[] = [];
  const poller = createNotificationPoller({
    poll: () => {
      calls += 1;
      return new Promise<void>((resolve) => {
        resolvePoll = resolve;
      });
    },
    schedule: (callback, delay) => {
      const handle = { callback, delay };
      scheduled.push(handle);
      return handle;
    },
    cancel: (handle) => cancelled.push(handle),
  });

  poller.start();
  poller.wake();
  assert.equal(calls, 1);

  poller.setActive(false);
  resolvePoll();
  await flush();
  assert.equal(scheduled.length, 0);

  poller.setActive(true);
  assert.equal(calls, 2);
  poller.stop();
  assert.equal(poller.isStopped(), true);
  assert.ok(cancelled.length <= 1);
});

test("polling backs off 10s to 30s to 60s and resets after success", async () => {
  const outcomes = [false, false, false, true];
  const scheduled: Array<{ callback: () => void; delay: number }> = [];
  const poller = createNotificationPoller({
    poll: async () => {
      if (!outcomes.shift()) throw new Error("offline");
    },
    schedule: (callback, delay) => {
      const handle = { callback, delay };
      scheduled.push(handle);
      return handle;
    },
    cancel: () => undefined,
  });

  poller.start();
  await flush();
  const first = scheduled.shift();
  assert.equal(first?.delay, 10_000);
  first?.callback();
  await flush();
  const second = scheduled.shift();
  assert.equal(second?.delay, 30_000);
  second?.callback();
  await flush();
  const third = scheduled.shift();
  assert.equal(third?.delay, 60_000);
  third?.callback();
  await flush();
  assert.equal(scheduled.shift()?.delay, 10_000);
  poller.stop();
});

test("notification validators build stable private conditional requests", () => {
  const etag = buildNotificationEtag({
    latestCreatedAt: new Date("2026-07-26T00:00:00.000Z"),
    visibleCount: 4,
    unreadCount: 2,
    filter: "ALL",
  });
  assert.match(etag, /^"[A-Za-z0-9_-]+"$/);
  assert.equal(
    etag,
    buildNotificationEtag({
      latestCreatedAt: new Date("2026-07-26T00:00:00.000Z"),
      visibleCount: 4,
      unreadCount: 2,
      filter: "ALL",
    }),
  );
  assert.notEqual(
    etag,
    buildNotificationEtag({
      latestCreatedAt: new Date("2026-07-26T00:00:00.000Z"),
      visibleCount: 4,
      unreadCount: 1,
      filter: "ALL",
    }),
  );
  assert.deepEqual(notificationPollHeaders(etag), {
    "If-None-Match": etag,
  });
  assert.deepEqual(notificationPollHeaders(null), {});
});
