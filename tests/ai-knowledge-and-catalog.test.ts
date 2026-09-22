import assert from "node:assert/strict";
import test from "node:test";
import * as XLSX from "xlsx";
import {
  formatPaintType,
  formatFinish,
  fetchLiveOrFallbackCatalog,
  compileCatalogToMarkdown,
  getCachedCatalogKnowledge,
  getCatalogStats,
} from "../src/lib/chat/ai-catalog-knowledge.ts";
import {
  determineFileType,
  convertSheetToMarkdown,
  parseUploadedKnowledgeBuffer,
  addKnowledgeDocument,
  getKnowledgeDocuments,
  toggleKnowledgeDocumentActive,
  deleteKnowledgeDocument,
  getActiveKnowledgePromptContext,
} from "../src/lib/chat/ai-knowledge-service.ts";
import { ADMIN_API_POLICIES } from "../src/lib/admin/admin-api-policy.ts";

test("ai-catalog-knowledge formats paint types and finishes into readable Vietnamese", () => {
  assert.strictEqual(formatPaintType("INTERIOR"), "Sơn nội thất");
  assert.strictEqual(formatPaintType("EXTERIOR"), "Sơn ngoại thất");
  assert.strictEqual(formatPaintType("PRIMER"), "Sơn lót kháng kiềm");
  assert.strictEqual(formatPaintType("WATERPROOF"), "Sơn chống thấm");
  assert.strictEqual(formatFinish("MATTE"), "Bề mặt mờ cổ điển");
  assert.strictEqual(formatFinish("GLOSS"), "Bóng cao cấp rực rỡ");
});

test("ai-catalog-knowledge fetches products and compiles to markdown knowledge", async () => {
  const data = await fetchLiveOrFallbackCatalog();
  assert.ok(data.products.length > 0, "must contain products");
  assert.ok(data.products[0].name, "product must have name");
  assert.ok(data.products[0].sku, "product must have sku");

  const md = compileCatalogToMarkdown(data);
  assert.ok(md.includes("DANH MỤC SẢN PHẨM & BẢNG GIÁ SƠN JOTUN"), "must have header");
  assert.ok(md.includes(data.products[0].name), "must include product name");

  const cached = await getCachedCatalogKnowledge();
  assert.ok(cached.length > 50, "cached catalog must not be empty");

  const stats = await getCatalogStats();
  assert.ok(stats.productCount > 0, "stats must report positive product count");
});

test("ai-knowledge-service correctly classifies file extensions", () => {
  assert.strictEqual(determineFileType("bang_gia_son.xlsx"), "excel");
  assert.strictEqual(determineFileType("danh_muc.xls"), "excel");
  assert.strictEqual(determineFileType("chi_tiet.csv"), "excel");
  assert.strictEqual(determineFileType("huong_dan_thi_cong.docx"), "word");
  assert.strictEqual(determineFileType("ghi_chu.txt"), "text");
  assert.strictEqual(determineFileType("readme.md"), "text");
});

test("ai-knowledge-service converts Excel sheets to Markdown tables", () => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Tên sơn", "Dung tích", "Giá niêm yết"],
    ["Jotun Majestic Sang Trọng", "5L", "1.450.000 đ"],
    ["Jotun Jotashield Ngoại Thất", "15L", "3.200.000 đ"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Bảng giá Jotun");

  const tableMd = convertSheetToMarkdown(ws, "Bảng giá Jotun");
  assert.ok(tableMd.includes("Trang tính: Bảng giá Jotun"), "must include sheet name");
  assert.ok(tableMd.includes("| Tên sơn | Dung tích | Giá niêm yết |"), "must have table header");
  assert.ok(tableMd.includes("| --- | --- | --- |"), "must have markdown separator");
  assert.ok(tableMd.includes("| Jotun Majestic Sang Trọng | 5L | 1.450.000 đ |"), "must have row 1");
  assert.ok(tableMd.includes("| Jotun Jotashield Ngoại Thất | 15L | 3.200.000 đ |"), "must have row 2");
});

test("ai-knowledge-service parses uploaded buffers for Excel and Text", async () => {
  // Test Text
  const textBuffer = Buffer.from("Chính sách bảo hành sơn Jotun 5 năm cho công trình đạt chuẩn.", "utf-8");
  const parsedText = await parseUploadedKnowledgeBuffer("chinh_sach.txt", textBuffer);
  assert.strictEqual(parsedText.fileType, "text");
  assert.ok(parsedText.content.includes("Chính sách bảo hành"), "text content parsed");

  // Test Excel
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([["Mã màu", "Tên màu"], ["10678", "Space"]]);
  XLSX.utils.book_append_sheet(wb, ws, "Màu sắc");
  const excelBuffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  const parsedExcel = await parseUploadedKnowledgeBuffer("bang_mau.xlsx", excelBuffer);
  assert.strictEqual(parsedExcel.fileType, "excel");
  assert.ok(parsedExcel.content.includes("10678"), "excel content parsed");
});

test("ai-knowledge-service handles document lifecycle (add, list, toggle, delete)", async () => {
  const testFilename = `test_doc_${Date.now()}.txt`;
  const buffer = Buffer.from("Tài liệu thử nghiệm cơ sở tri thức AI.", "utf-8");

  // 1. Add
  const doc = await addKnowledgeDocument(testFilename, buffer);
  assert.ok(doc.id, "must have generated id");
  assert.strictEqual(doc.filename, testFilename);
  assert.strictEqual(doc.isActive, true);

  // 2. List & find
  const docsAfterAdd = await getKnowledgeDocuments();
  const found = docsAfterAdd.find((d) => d.id === doc.id);
  assert.ok(found, "added doc must be present in documents list");

  // 3. Prompt context includes active document
  const contextActive = await getActiveKnowledgePromptContext();
  assert.ok(contextActive.includes(testFilename), "active document must be in prompt context");

  // 4. Toggle inactive
  const toggled = await toggleKnowledgeDocumentActive(doc.id, false);
  assert.ok(toggled, "must return updated doc");
  assert.strictEqual(toggled.isActive, false);

  const contextInactive = await getActiveKnowledgePromptContext();
  assert.ok(!contextInactive.includes(testFilename), "inactive document must NOT be in prompt context");

  // 5. Delete
  const deleted = await deleteKnowledgeDocument(doc.id);
  assert.strictEqual(deleted, true);

  const docsAfterDelete = await getKnowledgeDocuments();
  assert.ok(!docsAfterDelete.some((d) => d.id === doc.id), "doc must be removed");
});

test("admin-api-policy protects ai-knowledge endpoints under staff and admin roles", () => {
  const getPolicy = ADMIN_API_POLICIES.find(
    (p) => p.route === "/api/admin/chat/ai-knowledge" && p.method === "GET",
  );
  assert.ok(getPolicy, "GET /api/admin/chat/ai-knowledge policy must exist");
  assert.strictEqual(getPolicy.access.kind, "role");
  if (getPolicy.access.kind === "role") {
    assert.strictEqual(getPolicy.access.minimum, "STAFF");
  }

  const postPolicy = ADMIN_API_POLICIES.find(
    (p) => p.route === "/api/admin/chat/ai-knowledge" && p.method === "POST",
  );
  assert.ok(postPolicy, "POST /api/admin/chat/ai-knowledge policy must exist");
  assert.strictEqual(postPolicy.access.kind, "role");
  if (postPolicy.access.kind === "role") {
    assert.strictEqual(postPolicy.access.minimum, "ADMIN");
  }

  const patchPolicy = ADMIN_API_POLICIES.find(
    (p) => p.route === "/api/admin/chat/ai-knowledge/[id]" && p.method === "PATCH",
  );
  assert.ok(patchPolicy, "PATCH /api/admin/chat/ai-knowledge/[id] policy must exist");
  assert.strictEqual(patchPolicy.access.kind, "role");
  if (patchPolicy.access.kind === "role") {
    assert.strictEqual(patchPolicy.access.minimum, "ADMIN");
  }

  const deletePolicy = ADMIN_API_POLICIES.find(
    (p) => p.route === "/api/admin/chat/ai-knowledge/[id]" && p.method === "DELETE",
  );
  assert.ok(deletePolicy, "DELETE /api/admin/chat/ai-knowledge/[id] policy must exist");
  assert.strictEqual(deletePolicy.access.kind, "role");
  if (deletePolicy.access.kind === "role") {
    assert.strictEqual(deletePolicy.access.minimum, "ADMIN");
  }
});
