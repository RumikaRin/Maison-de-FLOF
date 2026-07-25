import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import {
  lighthouseGateUrls,
  runLighthouseGate,
} from "../scripts/run-lighthouse-gate.ts";

const require = createRequire(import.meta.url);
const {
  installLighthouseCleanupShim,
  isRecoverableLighthouseCleanupError,
} = require("../scripts/lighthouse-windows-fs-shim.cjs") as {
  installLighthouseCleanupShim: (
    fsModule: { rmSync: (path: string, options?: object) => void },
    platform: string,
    tempDirectory: string,
  ) => void;
  isRecoverableLighthouseCleanupError: (
    error: unknown,
    path: string,
    options: object,
    platform: string,
    tempDirectory: string,
  ) => boolean;
};

test("runs every configured Lighthouse URL in order", () => {
  const visited: string[] = [];

  runLighthouseGate(lighthouseGateUrls, (url) => {
    visited.push(url);
    return 0;
  });

  assert.deepEqual(visited, [
    "http://127.0.0.1:3100/",
    "http://127.0.0.1:3100/products",
    "http://127.0.0.1:3100/login",
  ]);
});

test("stops at the first failed route without masking the exit code", () => {
  const visited: string[] = [];

  assert.throws(
    () =>
      runLighthouseGate(lighthouseGateUrls, (url) => {
        visited.push(url);
        return url.endsWith("/products") ? 17 : 0;
      }),
    /LIGHTHOUSE_ROUTE_FAILED:\/products:17/,
  );

  assert.deepEqual(visited, [
    "http://127.0.0.1:3100/",
    "http://127.0.0.1:3100/products",
  ]);
});

test("recognizes only the known Windows Lighthouse temp cleanup failure", () => {
  const error = Object.assign(new Error("locked"), { code: "EPERM" });
  const options = { recursive: true, force: true };

  assert.equal(
    isRecoverableLighthouseCleanupError(
      error,
      "D:\\Temp\\lighthouse.12345",
      options,
      "win32",
      "D:\\Temp",
    ),
    true,
  );
  assert.equal(
    isRecoverableLighthouseCleanupError(
      error,
      "D:\\Temp\\other.12345",
      options,
      "win32",
      "D:\\Temp",
    ),
    false,
  );
  assert.equal(
    isRecoverableLighthouseCleanupError(
      error,
      "D:\\Temp\\lighthouse.12345",
      options,
      "linux",
      "D:\\Temp",
    ),
    false,
  );
});

test("cleanup shim swallows the exact EPERM but preserves unrelated failures", () => {
  const recoverable = Object.assign(new Error("locked"), { code: "EPERM" });
  const unrelated = Object.assign(new Error("denied"), { code: "EACCES" });
  const calls: string[] = [];
  const fakeFs: {
    rmSync: (path: string, options?: object) => void;
  } = {
    rmSync(path: string) {
      calls.push(path);
      if (path.includes("lighthouse.")) throw recoverable;
      throw unrelated;
    },
  };

  installLighthouseCleanupShim(fakeFs, "win32", "D:\\Temp");

  assert.doesNotThrow(() =>
    fakeFs.rmSync("D:\\Temp\\lighthouse.12345", {
      recursive: true,
      force: true,
    }),
  );
  assert.throws(
    () =>
      fakeFs.rmSync("D:\\Temp\\other.12345", {
        recursive: true,
        force: true,
      }),
    unrelated,
  );
  assert.equal(calls.length, 2);
});
