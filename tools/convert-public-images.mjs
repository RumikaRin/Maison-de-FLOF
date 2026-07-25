import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicDir = path.join(process.cwd(), "public");
const minBytes = 500 * 1024;
const skippedFiles = new Set(["payment_qr.png"]);

const entries = await fs.readdir(publicDir, { withFileTypes: true });
const pngFiles = entries
  .filter((entry) => entry.isFile() && entry.name.endsWith(".png") && !skippedFiles.has(entry.name))
  .map((entry) => path.join(publicDir, entry.name));

for (const file of pngFiles) {
  const stat = await fs.stat(file);
  if (stat.size < minBytes) continue;

  const output = file.replace(/\.png$/, ".webp");
  await sharp(file).webp({ quality: 82 }).toFile(output);
  const nextStat = await fs.stat(output);
  console.log(`${path.basename(file)} -> ${path.basename(output)} ${stat.size} ${nextStat.size}`);
}
