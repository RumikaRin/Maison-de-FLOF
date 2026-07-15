"use client";

import dynamic from "next/dynamic";

export const LazyChatBubble = dynamic(
  () => import("@/components/layout/ChatBubble").then((mod) => mod.ChatBubble),
  { ssr: false },
);
