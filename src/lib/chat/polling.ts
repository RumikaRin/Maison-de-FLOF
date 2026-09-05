export const CHAT_POLL_INITIAL_DELAY = 3000;
export const CHAT_POLL_MAX_DELAY = 30000;
export const CHAT_POLL_BACKOFF_MULTIPLIER = 1.8;

export type PollOutcome = "not_modified" | "modified" | "error";

export function calculateNextChatDelay(
  currentDelay: number,
  outcome: PollOutcome,
): number {
  if (outcome === "modified") {
    return CHAT_POLL_INITIAL_DELAY;
  }
  if (outcome === "not_modified") {
    return Math.min(
      Math.round(currentDelay * CHAT_POLL_BACKOFF_MULTIPLIER),
      CHAT_POLL_MAX_DELAY,
    );
  }
  return Math.min(
    Math.max(Math.round(currentDelay * CHAT_POLL_BACKOFF_MULTIPLIER), 10000),
    CHAT_POLL_MAX_DELAY,
  );
}

export function getConversationLastModified(
  conversation: {
    updatedAt?: Date | string | null;
    messages?: Array<{ createdAt?: Date | string | null }>;
  } | null,
): Date {
  if (!conversation) {
    return new Date(0);
  }

  const latestMessage = conversation.messages?.[conversation.messages.length - 1];
  const messageTime = latestMessage?.createdAt
    ? new Date(latestMessage.createdAt).getTime()
    : 0;
  const convTime = conversation.updatedAt
    ? new Date(conversation.updatedAt).getTime()
    : 0;

  const rawTime = Math.max(messageTime, convTime);
  // HTTP-date headers only have 1-second resolution (RFC 7231 / RFC 7232)
  const flooredTime = rawTime > 0 ? Math.floor(rawTime / 1000) * 1000 : 0;
  return new Date(flooredTime);
}

export function isNotModified(
  lastModifiedTime: number,
  ifModifiedSince: string | null,
): boolean {
  if (!ifModifiedSince) {
    return false;
  }
  const ifModifiedTime = Date.parse(ifModifiedSince);
  if (isNaN(ifModifiedTime)) {
    return false;
  }
  return lastModifiedTime <= ifModifiedTime;
}
