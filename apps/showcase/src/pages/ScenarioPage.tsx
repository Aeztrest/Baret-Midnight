import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Info, ShieldAlert, ShieldCheck } from "lucide-react";
import { analyzeTransaction } from "@baret-midnight/policy-engine";
import { Container, Eyebrow } from "../components/Chrome";
import { SCENARIOS } from "../scenarios";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "border-primary/30 bg-primary/10 text-primary",
};

export default function ScenarioPage() {
  const { slug } = useParams();
  const scenario = SCENARIOS.find((s) => s.slug === slug);
  const [connected, setConnected] = useState(false);

  if (!scenario) {
    return (
      <Container className="py-16">
        <p className="text-muted">Unknown scenario.</p>
        <Link to="/showcase" className="text-primary underline">
          Back to the gallery
        </Link>
      </Container>
    );
  }

  const result = analyzeTransaction(scenario.intent, scenario.context);

  return (
    <div className="px-5 py-16 sm:px-8">
      <Container className="max-w-3xl">
        <Link to="/showcase" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={14} /> Back to gallery
        </Link>
        <Eyebrow>{scenario.tag}</Eyebrow>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">{scenario.siteName}</h1>
        <p className="mt-3 max-w-xl text-muted">{scenario.description}</p>

        <div className="mt-10 overflow-hidden rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-3">
            <span className="font-mono text-xs text-muted">{scenario.intent.originSite}</span>
            <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase text-muted">
              simulated site
            </span>
          </div>
          <div className="bg-card p-6 text-center">
            {!connected ? (
              <>
                <p className="text-sm text-muted">
                  {scenario.siteName} wants to call <code className="text-foreground">{scenario.intent.circuitId}</code>{" "}
                  on <code className="text-foreground">{scenario.intent.contractAddress}</code>.
                </p>
                <button
                  onClick={() => setConnected(true)}
                  className="mt-4 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
                >
                  Connect wallet &amp; continue
                </button>
              </>
            ) : (
              <div className="text-left">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-mono text-xs uppercase tracking-wider text-muted">Baret pre-sign review</span>
                  {result.requiresManualApproval ? (
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Needs your approval
                    </span>
                  ) : (
                    <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Signs silently</span>
                  )}
                </div>
                {result.findings.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-4 text-sm text-muted">
                    <ShieldCheck size={16} className="text-primary" /> No risk findings.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.findings.map((f) => (
                      <div key={f.id} className={`rounded-lg border p-3 text-left ${SEVERITY_STYLES[f.severity]}`}>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {f.severity === "critical" ? <ShieldAlert size={14} /> : <Info size={14} />}
                          {f.title}
                        </div>
                        <p className="mt-1 text-xs opacity-90">{f.detail}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex gap-2">
                  <button className="flex-1 rounded-md border border-border py-2.5 text-sm font-semibold">Reject</button>
                  <button className="flex-1 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground">
                    Approve anyway
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="mt-6 text-xs text-muted">
          Same analysis engine as the{" "}
          <Link to="/demo" className="text-primary underline underline-offset-2">
            free-form demo
          </Link>{" "}
          — try changing the numbers yourself there.
        </p>
      </Container>
    </div>
  );
}
