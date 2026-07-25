import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const HTTP_METHODS = ["get", "post", "patch", "delete"] as const;

export type ApiOperation = {
  path: string;
  method: (typeof HTTP_METHODS)[number];
  file: string;
};

async function findRouteFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) return findRouteFiles(absolute);
      return entry.name === "route.ts" ? [absolute] : [];
    }),
  );
  return nested.flat();
}

function normalizeRoutePath(root: string, file: string) {
  const relativeDirectory = path
    .relative(root, path.dirname(file))
    .replaceAll("\\", "/");
  const normalized = relativeDirectory
    .replace(/\[\.\.\.([^\]]+)\]/g, "{$1}")
    .replace(/\[([^\]]+)\]/g, "{$1}");
  return `/api${normalized ? `/${normalized}` : ""}`;
}

export async function discoverApiOperations(
  root = "src/app/api",
): Promise<ApiOperation[]> {
  const absoluteRoot = path.resolve(root);
  const files = await findRouteFiles(absoluteRoot);
  const operations = (
    await Promise.all(
      files.map(async (file) => {
        const source = await readFile(file, "utf8");
        const relativeFile = path
          .relative(process.cwd(), file)
          .replaceAll("\\", "/");
        const routePath = normalizeRoutePath(absoluteRoot, file);
        const detected = new Set(
          HTTP_METHODS.filter((method) =>
            new RegExp(
            `export\\s+async\\s+function\\s+${method.toUpperCase()}\\s*\\(`,
            ).test(source),
          ),
        );
        for (const match of source.matchAll(
          /export\s+const\s*\{([^}]+)\}\s*=/g,
        )) {
          const exportedNames = match[1]
            .split(",")
            .map((name) => name.trim().toLowerCase());
          for (const method of HTTP_METHODS) {
            if (exportedNames.includes(method)) detected.add(method);
          }
        }
        return [...detected].map((method) => ({
          path: routePath,
          method,
          file: relativeFile,
        }));
      }),
    )
  ).flat();

  return operations.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      HTTP_METHODS.indexOf(left.method) - HTTP_METHODS.indexOf(right.method),
  );
}
