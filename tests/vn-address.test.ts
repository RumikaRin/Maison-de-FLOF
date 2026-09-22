import assert from "node:assert/strict";
import test from "node:test";
import { matchesVnName } from "../src/lib/vn-address.ts";

test("matchesVnName matches Vietnamese text regardless of accents or casing", () => {
  assert.equal(matchesVnName("Thành phố Hà Nội", "ha noi"), true);
  assert.equal(matchesVnName("Thành phố Hà Nội", "HÀ NỘI"), true);
  assert.equal(matchesVnName("Tỉnh Đắk Lắk", "dak lak"), true);
  assert.equal(matchesVnName("Tỉnh Đắk Lắk", "ĐẮK LẮK"), true);
  assert.equal(matchesVnName("Thành phố Hồ Chí Minh", "ho chi minh"), true);
  assert.equal(matchesVnName("Thành phố Đà Nẵng", "da nang"), true);
});

test("matchesVnName returns true for empty search query", () => {
  assert.equal(matchesVnName("Thành phố Cần Thơ", ""), true);
});

test("matchesVnName rejects non-matching queries", () => {
  assert.equal(matchesVnName("Thành phố Hải Phòng", "Da Nang"), false);
});
