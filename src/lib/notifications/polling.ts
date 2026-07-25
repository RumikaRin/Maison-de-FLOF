export const NOTIFICATION_POLL_DELAYS = [10_000, 30_000, 60_000] as const;

type TimerHandle = unknown;

type PollerOptions = {
  poll: () => Promise<void>;
  schedule?: (callback: () => void, delay: number) => TimerHandle;
  cancel?: (handle: TimerHandle) => void;
};

function delayForFailures(failures: number) {
  if (failures <= 0) return NOTIFICATION_POLL_DELAYS[0];
  return NOTIFICATION_POLL_DELAYS[
    Math.min(failures - 1, NOTIFICATION_POLL_DELAYS.length - 1)
  ];
}

export function createNotificationPoller({
  poll,
  schedule = (callback, delay) => window.setTimeout(callback, delay),
  cancel = (handle) => window.clearTimeout(handle as number),
}: PollerOptions) {
  let active = true;
  let started = false;
  let stopped = false;
  let inFlight = false;
  let failures = 0;
  let timer: TimerHandle | null = null;

  const clearTimer = () => {
    if (timer !== null) cancel(timer);
    timer = null;
  };

  const scheduleNext = () => {
    clearTimer();
    if (!active || stopped) return;
    timer = schedule(() => {
      timer = null;
      void tick();
    }, delayForFailures(failures));
  };

  const tick = async () => {
    if (!active || stopped || inFlight) return;
    inFlight = true;
    try {
      await poll();
      failures = 0;
    } catch {
      failures += 1;
    } finally {
      inFlight = false;
      scheduleNext();
    }
  };

  return {
    start() {
      if (started || stopped) return;
      started = true;
      void tick();
    },
    wake() {
      clearTimer();
      void tick();
    },
    setActive(nextActive: boolean) {
      if (stopped || active === nextActive) return;
      active = nextActive;
      clearTimer();
      if (active) void tick();
    },
    stop() {
      stopped = true;
      active = false;
      clearTimer();
    },
    isStopped() {
      return stopped;
    },
  };
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function buildNotificationEtag({
  latestCreatedAt,
  visibleCount,
  unreadCount,
  filter,
}: {
  latestCreatedAt: Date | null;
  visibleCount: number;
  unreadCount: number;
  filter: string;
}) {
  const validator = [
    latestCreatedAt?.toISOString() ?? "none",
    visibleCount,
    unreadCount,
    filter,
  ].join(":");
  return `"notifications-${stableHash(validator)}"`;
}

export function notificationPollHeaders(
  etag: string | null,
): Record<string, string> {
  return etag ? { "If-None-Match": etag } : {};
}
