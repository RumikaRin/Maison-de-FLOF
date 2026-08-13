import assert from "node:assert/strict";
import test from "node:test";
import { serializePublicBlogCard } from "../src/services/blog.service.ts";

test("public blog cards never serialize article bodies", () => {
  const card = serializePublicBlogCard({
    id: "blog-1",
    title: "Bảng màu mới",
    titleEn: null,
    slug: "bang-mau-moi",
    summary: "Tóm tắt",
    summaryEn: null,
    image: null,
    category: "Xu hướng",
    categoryEn: "Trends",
    createdAt: new Date("2026-07-27T00:00:00.000Z"),
    author: { name: "FLOF" },
  });

  assert.equal("content" in card, false);
  assert.equal("contentEn" in card, false);
  assert.equal(card.titleEn, "Bảng màu mới");
  assert.equal(card.createdAt, "2026-07-27");
});
