import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function srcFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return srcFiles(absolute);
      return entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) ? [absolute] : [];
    }),
  );
  return files.flat();
}

test("TSX source does not emit inline styles, motion elements, or framer-motion imports", async () => {
  const files = await srcFiles(path.resolve("src"));
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (file.endsWith(".tsx")) {
      if (/style\s*=\s*\{\{/.test(source)) violations.push(`${file}: inline style`);
      if (/<motion\./.test(source)) violations.push(`${file}: motion element`);
    }
    if (/from\s+["']framer-motion["']|require\s*\(\s*["']framer-motion["']\s*\)|import\s*\(["']framer-motion["']\)/.test(source)) {
      violations.push(`${file}: framer-motion import`);
    }
  }

  assert.deepEqual(violations, []);
});
