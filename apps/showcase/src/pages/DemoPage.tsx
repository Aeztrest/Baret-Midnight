import { useMemo, useState } from "react";
import { ShieldAlert, ShieldCheck, Info, Sparkles } from "lucide-react";
import { analyzeTransaction, type AnalysisContext, type TransactionIntent } from "@baret-midnight/policy-engine";
import { Container, Eyebrow } from "../components/Chrome";

const KNOWN_CIRCUIT = "0xPOLICY:authorizeSpend";

const SEVERITY_STYLES: Record<string, string> = {
  critical: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "border-primary/30 bg-primary/10 text-primary",
};

export default function DemoPage() {
  const [contractAddress, setContractAddress] = useState("0xPOLICY");
  const [circuitId, setCircuitId] = useState("authorizeSpend");
  const [amount, setAmount] = useState(50);
  const [capPerTx, setCapPerTx] = useState(100);
  const [capPerDay, setCapPerDay] = useState(500);
  const [spentThisPeriod, setSpentThisPeriod] = useState(0);
  const [initiator, setInitiator] = useState<"user" | "agent">("user");
  const [provingMode, setProvingMode] = useState<"local" | "delegated">("local");
  const [discloseWitness, setDiscloseWitness] = useState(false);
  const [known, setKnown] = useState(true);

  const result = useMemo(() => {
    const intent: TransactionIntent = {
      contractAddress,
      circuitId,
      args: { amount },
      disclosures: discloseWitness ? [{ field: "signerSecretKey", source: "witness" }] : [],
      provingMode,
      originSite: "demo.baret",
      initiator,
    };
    const ctx: AnalysisContext = {
      knownCircuits: known ? new Set([`${contractAddress}:${circuitId}`, KNOWN_CIRCUIT]) : new Set(),
      policy: {
        status: "ACTIVE",
        capPerTx: BigInt(capPerTx),
        capPerDay: BigInt(capPerDay),
        spentThisPeriod: BigInt(spentThisPeriod),
      },
      balanceDeltas: [{ asset: "tDUST", before: BigInt(1000), after: BigInt(1000 - amount) }],
      calledContracts: [],
    };
    return analyzeTransaction(intent, ctx);
  }, [contractAddress, circuitId, amount, capPerTx, capPerDay, spentThisPeriod, initiator, provingMode, discloseWitness, known]);

  return (
    <div className="px-5 py-16 sm:px-8">
      <Container>
        <Eyebrow>Live, in your browser</Eyebrow>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Try the real risk engine
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          This isn't a mockup — it's <code className="text-foreground">@baret-midnight/policy-engine</code>, the
          exact package the browser extension and the x402 facilitator use, running client-side against
          whatever you type below.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-5 rounded-xl border border-border bg-card p-6">
            <Field label="Contract address">
              <input
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Circuit">
              <select value={circuitId} onChange={(e) => setCircuitId(e.target.value)} className="input">
                <option value="authorizeSpend">authorizeSpend</option>
                <option value="setPolicy">setPolicy</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Amount">
                <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="input" />
              </Field>
              <Field label="Spent this period">
                <input
                  type="number"
                  value={spentThisPeriod}
                  onChange={(e) => setSpentThisPeriod(Number(e.target.value))}
                  className="input"
                />
              </Field>
              <Field label="Cap per tx">
                <input type="number" value={capPerTx} onChange={(e) => setCapPerTx(Number(e.target.value))} className="input" />
              </Field>
              <Field label="Cap per day">
                <input type="number" value={capPerDay} onChange={(e) => setCapPerDay(Number(e.target.value))} className="input" />
              </Field>
            </div>
            <Field label="Initiator">
              <div className="flex gap-2">
                {(["user", "agent"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setInitiator(v)}
                    className={`flex-1 rounded-md border py-2 text-sm capitalize ${
                      initiator === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Proving mode">
              <div className="flex gap-2">
                {(["local", "delegated"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setProvingMode(v)}
                    className={`flex-1 rounded-md border py-2 text-sm capitalize ${
                      provingMode === v ? "border-primary bg-primary/10 text-primary" : "border-border text-muted"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={discloseWitness} onChange={(e) => setDiscloseWitness(e.target.checked)} />
              Discloses a witness (private) field
            </label>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={known} onChange={(e) => setKnown(e.target.checked)} />
              Contract + circuit is on the known/whitelisted list
            </label>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <span className="font-mono text-xs uppercase tracking-wider text-muted">Verdict</span>
              <VerdictBadge severity={result.highestSeverity} requiresApproval={result.requiresManualApproval} />
            </div>
            {result.findings.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted">
                <ShieldCheck size={16} className="text-primary" /> No risk findings — this would sign silently.
              </div>
            ) : (
              result.findings.map((f) => (
                <div key={f.id} className={`rounded-xl border p-4 ${SEVERITY_STYLES[f.severity]}`}>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {f.severity === "critical" ? <ShieldAlert size={14} /> : f.severity === "warning" ? <Info size={14} /> : <Sparkles size={14} />}
                    {f.title}
                  </div>
                  <p className="mt-1 text-xs opacity-90">{f.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </Container>
      <style>{`.input { width: 100%; border: 1px solid rgb(var(--border)); background: rgb(var(--card)); border-radius: 0.375rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-muted">{label}</span>
      {children}
    </label>
  );
}

function VerdictBadge({ severity, requiresApproval }: { severity: string; requiresApproval: boolean }) {
  if (severity === "critical") {
    return <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-600 dark:text-red-400">Blocked by default</span>;
  }
  if (requiresApproval) {
    return <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">Needs your approval</span>;
  }
  return <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">Signs silently</span>;
}
