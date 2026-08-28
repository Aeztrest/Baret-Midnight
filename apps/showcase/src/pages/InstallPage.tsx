import { Check, Github, Terminal } from "lucide-react";
import { Container, Eyebrow } from "../components/Chrome";

const STEPS = [
  {
    title: "Clone the repository",
    code: "git clone https://github.com/Aeztrest/Baret-Midnight.git\ncd Baret-Midnight",
  },
  {
    title: "Install dependencies",
    code: "pnpm install",
  },
  {
    title: "Build the extension",
    code: "cd apps/extension\nnode build.mjs",
    note: "This produces ./dist — the unpacked extension.",
  },
  {
    title: "Load it in Chrome",
    code: null,
    note: 'Go to chrome://extensions, enable "Developer mode", click "Load unpacked", and select apps/extension/dist.',
  },
];

export default function InstallPage() {
  return (
    <div className="px-5 py-16 sm:px-8">
      <Container className="max-w-3xl">
        <Eyebrow>Install</Eyebrow>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Run Baret locally, from source.
        </h1>
        <p className="mt-3 text-muted">
          Baret isn't in a browser store yet — it's a working prototype you build and load yourself.
          Every step below is exactly what the project's own CI does.
        </p>

        <div className="mt-10 space-y-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <h3 className="font-semibold">{s.title}</h3>
              </div>
              {s.code && (
                <pre className="mt-3 overflow-x-auto rounded-lg bg-secondary/60 p-3 font-mono text-xs">
                  <code>{s.code}</code>
                </pre>
              )}
              {s.note && <p className="mt-2 text-sm text-muted">{s.note}</p>}
            </div>
          ))}
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
