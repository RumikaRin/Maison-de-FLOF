import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePagination,
  PaginationError,
} from "../src/lib/pagination.ts";

test("pagination returns defaults when query parameters are absent", () => {
  assert.deepEqual(parsePagination(new URLSearchParams()), {
    page: 1,
    limit: 20,
    requested: false,
  });
});

test("pagination accepts bounded positive integers", () => {
  assert.deepEqual(
    parsePagination(new URLSearchParams("page=2&limit=50")),
    {
      page: 2,
      limit: 50,
      requested: true,
    },
  );
});

for (const query of [
  "page=0",
  "page=-1",
  "page=1.5",
  "page=nope",
  "limit=0",
  "limit=-1",
  "limit=1.5",
  "limit=nope",
  "limit=101",
]) {
  test(`pagination rejects invalid query: ${query}`, () => {
    assert.throws(
      () => parsePagination(new URLSearchParams(query)),
      PaginationError,
    );
  });
}
