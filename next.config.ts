import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Copy generated assets on startup
try {
  const srcDir = "C:\\Users\\sansm\\.gemini\\antigravity-ide\\brain\\20eed820-cef9-4f57-9fa8-7ed125849303";
  const destDir = path.join(process.cwd(), "public");

  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const filesToCopy = [
    { src: "hero_bg_1780672474745.png", dest: "hero_bg.png" },
    { src: "product_interior_1780672489408.png", dest: "product_interior.png" },
    { src: "room_inspiration_1780672504341.png", dest: "room_inspiration.png" }
  ];

  filesToCopy.forEach(file => {
    const srcPath = path.join(srcDir, file.src);
    const destPath = path.join(destDir, file.dest);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`[Asset Copier] Copied ${file.src} to ${file.dest}`);
    } else {
      console.warn(`[Asset Copier] Source file not found: ${srcPath}`);
    }
  });
} catch (err) {
  console.error("[Asset Copier] Error copying files:", err);
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
