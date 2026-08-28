// Zips the already-built extension (apps/extension/dist) into apps/showcase/public so the
// Install page can offer a real download, not just build-from-source instructions.
// Pure-JS zip (via `archiver`) so this doesn't depend on a `zip` binary being present on the
// build image.
import archiver from "archiver";
import { createWriteStream, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "..", "..", "..");
const extensionDist = path.join(repoRoot, "apps", "extension", "dist");
const publicDir = path.join(repoRoot, "apps", "showcase", "public");
const outZip = path.join(publicDir, "baret-extension.zip");

if (!existsSync(extensionDist)) {
  console.error(`Extension dist not found at ${extensionDist} — build it first (pnpm --filter @baret-midnight/extension build).`);
  process.exit(1);
}

mkdirSync(publicDir, { recursive: true });

await new Promise((resolve, reject) => {
  const output = createWriteStream(outZip);
  const archive = archiver("zip", { zlib: { level: 9 } });
  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);
  archive.directory(extensionDist, false);
  archive.finalize();
});

console.log(`Wrote ${outZip}`);
