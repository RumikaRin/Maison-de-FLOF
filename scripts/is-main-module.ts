import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function isMainModule(
  moduleUrl: string,
  entryPath: string | undefined,
) {
  if (!entryPath) return false;
  return moduleUrl === pathToFileURL(resolve(entryPath)).href;
}
