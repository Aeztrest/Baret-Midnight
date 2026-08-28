import { build } from "esbuild";
import { mkdirSync, copyFileSync } from "node:fs";

const outdir = "dist";
mkdirSync(`${outdir}/approval`, { recursive: true });
mkdirSync(`${outdir}/popup`, { recursive: true });

await build({
  entryPoints: ["src/inject.ts", "src/content-bridge.ts"],
  bundle: true,
  format: "iife",
  outdir,
  target: "chrome111",
});

await build({
  entryPoints: { background: "src/background.ts" },
  bundle: true,
  format: "esm",
  outdir,
  target: "chrome111",
});

await build({
  entryPoints: { "approval/approval": "src/approval/approval.ts", "popup/popup": "src/popup/popup.ts" },
  bundle: true,
  format: "esm",
  outdir,
  target: "chrome111",
});

copyFileSync("manifest.json", `${outdir}/manifest.json`);
copyFileSync("src/approval/approval.html", `${outdir}/approval/approval.html`);
copyFileSync("src/popup/popup.html", `${outdir}/popup/popup.html`);

console.log("Extension built to ./dist");
