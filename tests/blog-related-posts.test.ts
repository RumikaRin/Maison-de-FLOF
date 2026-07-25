import assert from "node:assert/strict";
import test from "node:test";
import { rankRelatedPosts } from "../src/services/blog.service.ts";

const posts = [
  {
    id: "same-new",
    slug: "same-new",
    category: "color",
    isActive: true,
    createdAt: new Date("2026-07-04T00:00:00.000Z"),
  },
  {
    id: "other-newest",
    slug: "other-newest",
    category: "technical",
    isActive: true,
    createdAt: new Date("2026-07-05T00:00:00.000Z"),
  },
  {
    id: "same-old",
    slug: "same-old",
    category: "color",
    isActive: true,
    createdAt: new Date("2026-07-01T00:00:00.000Z"),
  },
  {
    id: "current",
    slug: "current",
    category: "color",
    isActive: true,
    createdAt: new Date("2026-07-06T00:00:00.000Z"),
  },
  {
    id: "inactive",
    slug: "inactive",
    category: "color",
    isActive: false,
    createdAt: new Date("2026-07-07T00:00:00.000Z"),
  },
  {
    id: "other-old",
    slug: "other-old",
    category: "technical",
    isActive: true,
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
  },
];

test("related posts prefer the same category then fall back to recency", () => {
  const ranked = rankRelatedPosts(posts, {
    currentSlug: "current",
    category: "color",
  });

  assert.deepEqual(
    ranked.map(({ slug }) => slug),
    ["same-new", "same-old", "other-newest"],
  );
});

test("related posts exclude inactive/current entries and cap results at three", () => {
  const ranked = rankRelatedPosts(posts, {
    currentSlug: "current",
    category: "missing-category",
  });

  assert.equal(ranked.length, 3);
  assert.ok(ranked.every(({ isActive, slug }) => isActive && slug !== "current"));
  assert.deepEqual(
    ranked.map(({ slug }) => slug),
    ["other-newest", "same-new", "same-old"],
  );
});
