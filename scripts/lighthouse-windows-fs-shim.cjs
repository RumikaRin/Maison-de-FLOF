"use strict";

const path = require("node:path");

function isRecoverableLighthouseCleanupError(
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

function installLighthouseCleanupShim(
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

module.exports = {
  installLighthouseCleanupShim,
  isRecoverableLighthouseCleanupError,
};

if (process.env.FLOF_LIGHTHOUSE_WINDOWS_FS_SHIM === "1") {
  const fs = require("node:fs");
  installLighthouseCleanupShim(fs);
  require("node:module").syncBuiltinESMExports();
}
