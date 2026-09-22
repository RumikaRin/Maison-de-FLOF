import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
import mammoth from "mammoth";

export type AiKnowledgeDocument = {
  id: string;
  filename: string;
  fileType: "excel" | "word" | "text";
  sizeBytes: number;
  charCount: number;
  tokenEstimate: number;
  isActive: boolean;
  content: string;
  createdAt: string;
  updatedAt: string;
};

const KNOWLEDGE_DIR = path.join(process.cwd(), "data", "ai-knowledge");
const DOCUMENTS_FILE = path.join(KNOWLEDGE_DIR, "documents.json");

export async function getKnowledgeDocuments(): Promise<AiKnowledgeDocument[]> {
  try {
    const raw = await readFile(DOCUMENTS_FILE, "utf-8");
    const docs = JSON.parse(raw) as AiKnowledgeDocument[];
    return Array.isArray(docs) ? docs : [];
  } catch {
    return [];
  }
}

export async function saveKnowledgeDocuments(docs: AiKnowledgeDocument[]): Promise<void> {
  await mkdir(KNOWLEDGE_DIR, { recursive: true });
  await writeFile(DOCUMENTS_FILE, JSON.stringify(docs, null, 2), "utf-8");
}

export function determineFileType(filename: string): "excel" | "word" | "text" {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".xlsx" || ext === ".xls" || ext === ".csv") {
    return "excel";
  }
  if (ext === ".docx") {
    return "word";
  }
  return "text";
}

export function convertSheetToMarkdown(sheet: XLSX.WorkSheet, sheetName: string): string {
  const rawRows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  if (!rawRows || rawRows.length === 0) {
    return "";
  }

  // Filter out empty rows
  const cleanRows = rawRows
    .map((row) => row.map((cell) => (cell !== null && cell !== undefined ? String(cell).trim() : "")))
    .filter((row) => row.some((cell) => cell.length > 0));

  if (cleanRows.length === 0) {
    return "";
  }

  const headerRow = cleanRows[0];
  const maxCols = Math.min(15, Math.max(...cleanRows.map((r) => r.length)));

  const padRow = (row: string[]) => {
    const padded = [...row];
    while (padded.length < maxCols) padded.push("");
    return padded.slice(0, maxCols);
  };

  const headerCells = padRow(headerRow).map((h, idx) => (h ? h.replace(/\|/g, "/") : `Cột ${idx + 1}`));
  const separatorCells = headerCells.map(() => "---");

  const markdownRows: string[] = [];
  markdownRows.push(`#### Trang tính: ${sheetName}`);
  markdownRows.push(`| ${headerCells.join(" | ")} |`);
  markdownRows.push(`| ${separatorCells.join(" | ")} |`);

  for (let i = 1; i < cleanRows.length; i++) {
    const cells = padRow(cleanRows[i]).map((c) => c.replace(/\|/g, "/").replace(/\n/g, " "));
    markdownRows.push(`| ${cells.join(" | ")} |`);
  }

  return markdownRows.join("\n");
}

export async function parseUploadedKnowledgeBuffer(
  filename: string,
  buffer: Buffer,
): Promise<{ content: string; fileType: "excel" | "word" | "text" }> {
  const fileType = determineFileType(filename);

  if (fileType === "excel") {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetSections: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (sheet) {
        const tableMd = convertSheetToMarkdown(sheet, sheetName);
        if (tableMd) {
          sheetSections.push(tableMd);
        }
      }
    }

    const content = sheetSections.join("\n\n").trim();
    return {
      content: content || "Không tìm thấy dữ liệu bảng tính trong file Excel.",
      fileType,
    };
  }

  if (fileType === "word") {
    const parsed = await mammoth.extractRawText({ buffer });
    const text = (parsed.value || "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      content: text || "Không tìm thấy nội dung văn bản trong file Word.",
      fileType,
    };
  }

  // Text, Markdown, CSV, JSON
  const rawText = buffer
    .toString("utf-8")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return {
    content: rawText || "Nội dung văn bản rỗng.",
    fileType,
  };
}

export async function addKnowledgeDocument(
  filename: string,
  buffer: Buffer,
): Promise<AiKnowledgeDocument> {
  const { content, fileType } = await parseUploadedKnowledgeBuffer(filename, buffer);

  const charCount = content.length;
  // Estimate tokens (~3.5 characters per token in Vietnamese/English mix)
  const tokenEstimate = Math.ceil(charCount / 3.5);

  const doc: AiKnowledgeDocument = {
    id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    filename,
    fileType,
    sizeBytes: buffer.length,
    charCount,
    tokenEstimate,
    isActive: true,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const docs = await getKnowledgeDocuments();
  docs.unshift(doc);
  await saveKnowledgeDocuments(docs);

  return doc;
}

export async function toggleKnowledgeDocumentActive(
  id: string,
  isActive: boolean,
): Promise<AiKnowledgeDocument | null> {
  const docs = await getKnowledgeDocuments();
  const target = docs.find((d) => d.id === id);
  if (!target) return null;

  target.isActive = isActive;
  target.updatedAt = new Date().toISOString();
  await saveKnowledgeDocuments(docs);
  return target;
}

export async function deleteKnowledgeDocument(id: string): Promise<boolean> {
  const docs = await getKnowledgeDocuments();
  const initialLength = docs.length;
  const filtered = docs.filter((d) => d.id !== id);
  if (filtered.length === initialLength) return false;

  await saveKnowledgeDocuments(filtered);
  return true;
}

export async function getActiveKnowledgePromptContext(): Promise<string> {
  const docs = await getKnowledgeDocuments();
  const activeDocs = docs.filter((d) => d.isActive && d.content.trim().length > 0);

  if (activeDocs.length === 0) {
    return "";
  }

  const sections = activeDocs.map((doc) => {
    return `#### TÀI LIỆU: ${doc.filename} (Loại: ${doc.fileType.toUpperCase()})\n${doc.content}`;
  });

  return `### CƠ SỞ TRI THỨC & TÀI LIỆU BỔ SUNG DO QUẢN TRỊ VIÊN CUNG CẤP:\n${sections.join("\n\n---\n\n")}`;
}
