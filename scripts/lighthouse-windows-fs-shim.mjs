import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import path from "node:path";

export function isRecoverableLighthouseCleanupError(
  error,
  targetPath,
  options,
  platform,
  tempDirectory,
) {
  if (
    platform !== "win32" ||
    !error ||
    error.code !== "EPERM" ||
    typeof targetPath !== "string" ||
    !options ||
    options.recursive !== true ||
    options.force !== true ||
    !tempDirectory
  ) {
    return false;
  }

  const pathApi = platform === "win32" ? path.win32 : path;
  const normalizedTarget = pathApi.resolve(targetPath);
  const normalizedTemp = pathApi.resolve(tempDirectory);

  return (
    pathApi.dirname(normalizedTarget).toLowerCase() ===
      normalizedTemp.toLowerCase() &&
    /^lighthouse\.\d+$/.test(pathApi.basename(normalizedTarget))
  );
}

export function installLighthouseCleanupShim(
  fsModule,
  platform = process.platform,
  tempDirectory = process.env.TEMP,
) {
  const originalRmSync = fsModule.rmSync.bind(fsModule);

  fsModule.rmSync = function rmSyncWithLighthouseCleanupGuard(
    targetPath,
    options,
  ) {
    try {
      return originalRmSync(targetPath, options);
    } catch (error) {
      if (
        isRecoverableLighthouseCleanupError(
          error,
          targetPath,
          options,
          platform,
          tempDirectory,
        )
      ) {
        process.stderr.write(
          "FLOF_LIGHTHOUSE_WINDOWS_CLEANUP_DEFERRED\n",
        );
        return undefined;
      }
      throw error;
    }
  };
}

if (process.env.FLOF_LIGHTHOUSE_WINDOWS_FS_SHIM === "1") {
  installLighthouseCleanupShim(fs);
  syncBuiltinESMExports();
}
