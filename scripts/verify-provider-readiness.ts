import { v2 as cloudinary } from "cloudinary";
import { Resend } from "resend";
import { isMainModule } from "./is-main-module.ts";

type ProviderResult = {
  provider: "upstash" | "resend" | "cloudinary";
  status: "PASS";
};

type ProviderName = ProviderResult["provider"];
const PROVIDER_VARIABLES: Record<ProviderName, readonly string[]> = {
  upstash: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
  resend: ["RESEND_API_KEY", "EMAIL_FROM"],
  cloudinary: [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ],
};

function safeProviderName(value: string | undefined): ProviderName | "unknown" {
  return value === "upstash" || value === "resend" || value === "cloudinary"
    ? value
    : "unknown";
}

export function createProviderFailureReport(
  providerValue: string | undefined,
  environment: Readonly<Record<string, string | undefined>>,
) {
  const provider = safeProviderName(providerValue);
  const missingVariables =
    provider === "unknown"
      ? []
      : PROVIDER_VARIABLES[provider].filter(
          (name) => !environment[name]?.trim(),
        );
  return {
    provider,
    status: "FAIL" as const,
    code: "PROVIDER_READINESS_FAILED" as const,
    missingVariables,
  };
}

export function parseMailbox(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

export async function verifyUpstashPing(
  request: () => Promise<Response>,
): Promise<ProviderResult> {
  const response = await request();
  if (!response.ok) throw new Error("Upstash readiness request failed");

  const data = (await response.json()) as Array<{ result?: unknown }>;
  if (data[0]?.result !== "PONG") {
    throw new Error("Upstash returned an invalid readiness response");
  }

  return { provider: "upstash", status: "PASS" };
}

export async function verifyResendAcceptance(
  send: () => Promise<{
    data: { id?: string } | null;
    error: unknown;
  }>,
  from: string,
  to: string,
): Promise<ProviderResult> {
  if (!parseMailbox(from) || !parseMailbox(to)) {
    throw new Error("Resend mailbox configuration is invalid");
  }

  const result = await send();
  if (result.error || !result.data?.id) {
    throw new Error("Resend did not accept the readiness message");
  }

  return { provider: "resend", status: "PASS" };
}

export async function verifyCloudinaryLifecycle(client: {
  upload: () => Promise<{ public_id: string }>;
  destroy: (publicId: string) => Promise<{ result?: string }>;
}): Promise<ProviderResult> {
  const uploaded = await client.upload();
  let validIdentifier = false;

  try {
    validIdentifier = uploaded.public_id.startsWith("flof/");
  } finally {
    const destroyed = await client.destroy(uploaded.public_id);
    if (destroyed.result !== "ok") {
      throw new Error("Cloudinary did not delete the disposable asset");
    }
  }

  if (!validIdentifier) {
    throw new Error("Cloudinary returned an unexpected public identifier");
  }

  return { provider: "cloudinary", status: "PASS" };
}

function requiredVariable(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing variable name: ${name}`);
  return value;
}

async function runProviderReadiness() {
  const provider = requiredVariable("PROVIDER_CHECK");

  if (provider === "upstash") {
    const url = requiredVariable("UPSTASH_REDIS_REST_URL").replace(/\/$/, "");
    const token = requiredVariable("UPSTASH_REDIS_REST_TOKEN");
    return verifyUpstashPing(() =>
      fetch(`${url}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([["PING"]]),
        signal: AbortSignal.timeout(5_000),
      }),
    );
  }

  if (provider === "resend") {
    const apiKey = requiredVariable("RESEND_API_KEY");
    const from = requiredVariable("EMAIL_FROM");
    const to = parseMailbox(
      process.env.PROVIDER_TEST_EMAIL?.trim() || from,
    );
    const resend = new Resend(apiKey);
    return verifyResendAcceptance(
      () =>
        resend.emails.send({
          from,
          to,
          subject: "FLOF provider readiness",
          html: "<p>Non-sensitive demo readiness check.</p>",
        }),
      from,
      to,
    );
  }

  if (provider === "cloudinary") {
    cloudinary.config({
      cloud_name: requiredVariable("CLOUDINARY_CLOUD_NAME"),
      api_key: requiredVariable("CLOUDINARY_API_KEY"),
      api_secret: requiredVariable("CLOUDINARY_API_SECRET"),
    });
    return verifyCloudinaryLifecycle({
      upload: async () => {
        const result = await cloudinary.uploader.upload(
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
          {
            folder: "flof/readiness",
            public_id: `p0-${Date.now().toString(36)}`,
            resource_type: "image",
          },
        );
        return { public_id: result.public_id };
      },
      destroy: async (publicId) =>
        cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
    });
  }

  throw new Error("Unsupported PROVIDER_CHECK value");
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    console.log(JSON.stringify(await runProviderReadiness()));
  } catch {
    console.error(
      JSON.stringify(
        createProviderFailureReport(process.env.PROVIDER_CHECK, process.env),
      ),
    );
    process.exitCode = 1;
  }
}
