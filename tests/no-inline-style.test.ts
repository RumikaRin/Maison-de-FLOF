import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

async function tsxFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return tsxFiles(absolute);
      return entry.isFile() && entry.name.endsWith(".tsx") ? [absolute] : [];
    }),
  );
  return files.flat();
}

test("TSX source does not emit inline styles or Framer Motion runtime styles", async () => {
  const files = await tsxFiles(path.resolve("src"));
  const violations: string[] = [];

  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (/style\s*=\s*\{\{/.test(source)) violations.push(`${file}: inline style`);
    if (/<motion\./.test(source)) violations.push(`${file}: motion element`);
  }

  assert.deepEqual(violations, []);
});
