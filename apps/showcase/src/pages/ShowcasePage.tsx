import { Link } from "react-router-dom";
import { ArrowRight, ShieldAlert } from "lucide-react";
import { Container, Eyebrow } from "../components/Chrome";
import { SCENARIOS } from "../scenarios";

export default function ShowcasePage() {
  return (
    <div className="px-5 py-16 sm:px-8">
      <Container>
        <Eyebrow>Threat gallery</Eyebrow>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Five sites. Five different risks.
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Each of these is a fictional dApp paired with a real transaction shape. Open one to see
          exactly what Baret's risk engine flags before you'd sign — computed live, not scripted.
        </p>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SCENARIOS.map((s) => (
            <Link
              key={s.slug}
              to={`/showcase/${s.slug}`}
              className="group rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted">{s.tag}</span>
                <ArrowRight size={14} className="text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h2 className="mt-2 font-display text-lg font-semibold">{s.siteName}</h2>
              <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <ShieldAlert size={13} /> {s.threat}
              </div>
              <p className="mt-2 text-sm text-muted">{s.description}</p>
            </Link>
          ))}
        </div>
      </Container>
    </div>
  );
}
