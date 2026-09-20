import { Resend } from "resend";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const fullPath = path.resolve(process.cwd(), file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...values] = trimmed.split("=");
        if (key && !process.env[key.trim()]) {
          const val = values.join("=").trim().replace(/^["']|["']$/g, "");
          process.env[key.trim()] = val;
        }
      }
    }
  }
}

loadEnv();

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey || apiKey === "re_your_api_key" || !apiKey.startsWith("re_")) {
  console.error("\n❌ LỖI: Chưa cấu hình RESEND_API_KEY hợp lệ trong .env!");
  console.error("👉 Vui lòng mở file .env và thay thế giá trị 're_your_api_key' bằng API key thật của bạn (dạng re_xxxxxxxxx).");
  console.error("👉 Lấy API key tại: https://resend.com/api-keys\n");
  process.exit(1);
}

// Resend test sandbox yêu cầu gửi từ 'onboarding@resend.dev' nếu domain riêng chưa được verify DNS
const from = process.env.RESEND_TEST_FROM || "onboarding@resend.dev";
const to = "sansmanh123@gmail.com";

console.log("\n==========================================");
console.log("📨 GỬI EMAIL THỬ NGHIỆM QUA RESEND API");
console.log("==========================================");
console.log(`• From:    ${from}`);
console.log(`• To:      ${to}`);
console.log(`• API Key: ${apiKey.slice(0, 7)}...${apiKey.slice(-4)}`);
console.log("------------------------------------------");

const resend = new Resend(apiKey);

try {
  const result = await resend.emails.send({
    from,
    to,
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });

  if (result.error) {
    console.error("❌ Resend API trả về lỗi:");
    console.error(result.error);
    process.exit(1);
  }

  console.log("✅ GỬI EMAIL THÀNH CÔNG!");
  console.log("• Email ID:", result.data?.id);
  console.log(`👉 Vui lòng kiểm tra hộp thư đến (hoặc thư mục Spam) của: ${to}\n`);
} catch (error) {
  console.error("❌ Ngoại lệ khi gửi email:", error);
  process.exit(1);
}
