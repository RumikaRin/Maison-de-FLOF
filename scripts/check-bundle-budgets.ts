import { readFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { isMainModule } from "./is-main-module.ts";

export const BUNDLE_BUDGETS = {
  sharedBytes: 115 * 1024,
  routeBytes: 210 * 1024,
} as const;

export const TARGET_ROUTE_MANIFEST_KEYS = {
  "/": "/page",
  "/products": "/products/page",
  "/colors": "/colors/page",
  "/blog": "/blog/page",
  "/color-visualizer": "/color-visualizer/page",
  "/find-dealer": "/find-dealer/page",
  "/login": "/login/page",
  "/register": "/register/page",
  "/profile": "/profile/page",
  "/admin": "/admin/page",
  "/admin/audit": "/admin/audit/page",
} as const;

export type BundleReport = {
  sharedBytes: number;
  routes: Record<string, number>;
};

export function evaluateBundleBudgets(
  report: BundleReport,
  budgets = BUNDLE_BUDGETS,
) {
  const failures: string[] = [];
  if (report.sharedBytes > budgets.sharedBytes) {
    failures.push(`shared=${report.sharedBytes}>${budgets.sharedBytes}`);
  }
  for (const [route, bytes] of Object.entries(report.routes)) {
    if (bytes > budgets.routeBytes) {
      failures.push(`${route}=${bytes}>${budgets.routeBytes}`);
    }
  }
  if (failures.length > 0) {
    throw new Error(`BUNDLE_BUDGET_EXCEEDED:${failures.join(",")}`);
  }
}

async function compressedBytes(nextDirectory: string, files: readonly string[]) {
  let bytes = 0;
  for (const file of new Set(files.filter((item) => item.endsWith(".js")))) {
    const source = await readFile(path.join(nextDirectory, file));
    bytes += gzipSync(source, { level: 9 }).byteLength;
  }
  return bytes;
}

export async function readBundleReport(nextDirectory = ".next") {
  const [buildManifest, appManifest] = await Promise.all([
    readFile(path.join(nextDirectory, "build-manifest.json"), "utf8").then(
      JSON.parse,
    ) as Promise<{ rootMainFiles: string[] }>,
    readFile(path.join(nextDirectory, "app-build-manifest.json"), "utf8").then(
      JSON.parse,
    ) as Promise<{ pages: Record<string, string[]> }>,
  ]);

  const routes: Record<string, number> = {};
  for (const [route, manifestKey] of Object.entries(
    TARGET_ROUTE_MANIFEST_KEYS,
  )) {
    const files = appManifest.pages[manifestKey];
    if (!files) throw new Error(`BUNDLE_ROUTE_MISSING:${route}:${manifestKey}`);
    routes[route] = await compressedBytes(nextDirectory, files);
  }

  return {
    sharedBytes: await compressedBytes(
      nextDirectory,
      buildManifest.rootMainFiles,
    ),
    routes,
  } satisfies BundleReport;
}

function formatKiB(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    const report = await readBundleReport();
    evaluateBundleBudgets(report);
    console.log(
      JSON.stringify({
        event: "bundle.budget_passed",
        shared: formatKiB(report.sharedBytes),
        routes: Object.fromEntries(
          Object.entries(report.routes).map(([route, bytes]) => [
            route,
            formatKiB(bytes),
          ]),
        ),
      }),
    );
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "BUNDLE_BUDGET_CHECK_FAILED",
    );
    process.exitCode = 1;
  }
}
