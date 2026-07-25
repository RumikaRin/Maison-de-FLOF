import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isMainModule } from "./is-main-module.ts";

export const lighthouseGateUrls = [
  "http://127.0.0.1:3100/",
  "http://127.0.0.1:3100/products",
  "http://127.0.0.1:3100/login",
] as const;

type RunRoute = (url: string) => number;

export function runLighthouseGate(
  urls: readonly string[],
  runRoute: RunRoute,
) {
  for (const url of urls) {
    const exitCode = runRoute(url);
    if (exitCode !== 0) {
      const route = new URL(url).pathname;
      throw new Error(`LIGHTHOUSE_ROUTE_FAILED:${route}:${exitCode}`);
    }
  }
}

function runLhciAutorun(url: string) {
  const cliPath = fileURLToPath(
    new URL("../node_modules/@lhci/cli/src/cli.js", import.meta.url),
  );
  const shimUrl = new URL(
    "./lighthouse-windows-fs-shim.mjs",
    import.meta.url,
  ).href;
  const nodeOptions = [
    process.env.NODE_OPTIONS,
    `--import=${JSON.stringify(shimUrl)}`,
  ]
    .filter(Boolean)
    .join(" ");
  const result = spawnSync(
    process.execPath,
    [cliPath, "autorun", `--collect.url=${url}`],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        FLOF_LIGHTHOUSE_WINDOWS_FS_SHIM: "1",
        NODE_OPTIONS: nodeOptions,
      },
    },
  );

  if (result.error) {
    console.error("LIGHTHOUSE_RUNNER_START_FAILED");
    return 1;
  }

  return result.status ?? 1;
}

if (isMainModule(import.meta.url, process.argv[1])) {
  try {
    runLighthouseGate(lighthouseGateUrls, runLhciAutorun);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "LIGHTHOUSE_GATE_FAILED");
    process.exitCode = 1;
  }
}
