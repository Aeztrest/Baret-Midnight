import { Check, Download, FolderOpen, Github, Terminal } from "lucide-react";
import { Container, Eyebrow } from "../components/Chrome";

const LOAD_STEPS = [
  { title: "Unzip it", note: "Extract baret-extension.zip anywhere on disk." },
  { title: "Open chrome://extensions", note: 'Enable "Developer mode" in the top-right corner.' },
  { title: '"Load unpacked"', note: "Select the unzipped folder. Baret is now active in this browser." },
];

const SOURCE_STEPS = [
  { title: "Clone the repository", code: "git clone https://github.com/Aeztrest/Baret-Midnight.git\ncd Baret-Midnight" },
  { title: "Install dependencies", code: "pnpm install" },
  { title: "Build the extension", code: "cd apps/extension\nnode build.mjs", note: "This produces ./dist — the unpacked extension." },
  { title: "Load it in Chrome", code: null, note: 'Go to chrome://extensions, enable "Developer mode", click "Load unpacked", and select apps/extension/dist.' },
];

export default function InstallPage() {
  return (
    <div className="px-5 py-16 sm:px-8">
      <Container className="max-w-3xl">
        <Eyebrow>Install</Eyebrow>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Get Baret running in your browser.
        </h1>
        <p className="mt-3 text-muted">
          Baret isn't in a browser store yet — download the built extension below, or build it from
          source. Every artifact here is produced by the project's own CI, not hand-packaged.
        </p>

        <div className="mt-10 rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Baret for Chrome / Brave / Edge</h2>
              <p className="mt-1 text-sm text-muted">Unpacked MV3 extension, built from this repo's main branch.</p>
            </div>
            <a
              href="/baret-extension.zip"
              download
              className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Download size={16} /> Download baret-extension.zip
            </a>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {LOAD_STEPS.map((s, i) => (
              <div key={s.title} className="rounded-lg border border-border bg-secondary/40 p-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="mt-2 text-sm font-semibold">{s.title}</h3>
                <p className="mt-1 text-xs text-muted">{s.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted">
          <Check size={16} className="shrink-0 text-primary" />
          Once loaded, visit any page and Baret will intercept <code className="text-foreground">window.midnight.lace</code>{" "}
          calls before they reach your wallet — see it in action on the{" "}
          <a href="/demo" className="text-primary underline underline-offset-2">
            live demo
          </a>{" "}
          page.
        </div>

        <details className="mt-10 rounded-xl border border-border bg-card p-5">
          <summary className="flex cursor-pointer items-center gap-2 font-semibold">
            <FolderOpen size={16} className="text-primary" /> Prefer to build it yourself from source?
          </summary>
          <div className="mt-4 space-y-4">
            {SOURCE_STEPS.map((s, i) => (
              <div key={s.title}>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h3 className="text-sm font-semibold">{s.title}</h3>
                </div>
                {s.code && (
                  <pre className="mt-2 ml-9 overflow-x-auto rounded-lg bg-secondary/60 p-3 font-mono text-xs">
                    <code>{s.code}</code>
                  </pre>
                )}
                {s.note && <p className="ml-9 mt-1 text-xs text-muted">{s.note}</p>}
              </div>
            ))}
          </div>
        </details>

        <a
          href="https://github.com/Aeztrest/Baret-Midnight"
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 rounded-md border border-border px-5 py-3 text-sm font-semibold hover:border-foreground/30"
        >
          <Github size={16} /> View source on GitHub
        </a>

        <div className="mt-10 flex items-start gap-2 rounded-xl border border-border bg-card p-4 text-xs text-muted">
          <Terminal size={14} className="mt-0.5 shrink-0" />
          Backend + x402 facilitator: <code className="text-foreground">cd apps/server &amp;&amp; pnpm dev</code>, or use the
          live deployment. See the repo README for details.
        </div>
      </Container>
    </div>
  );
}
