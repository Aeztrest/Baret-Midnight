import { Container, Eyebrow } from "../components/Chrome";

const DETECTORS = [
  { name: "Blind sign risk", detail: "Flags calls to a contract + circuit combination that isn't on the known/whitelisted list." },
  { name: "Unlimited approval risk", detail: "Catches policy updates that request an unreasonably high or effectively unlimited per-transaction cap." },
  { name: "Agentic x402 risk", detail: "Flags any payment initiated by an autonomous agent rather than a direct user action." },
  { name: "Balance delta simulation", detail: "Simulates the transaction against the public ledger and summarizes what state changes." },
  { name: "Contract interaction trace", detail: "Lists every contract the transaction calls, including chained cross-contract calls." },
  { name: "Disclosure detector", detail: "Midnight-specific: identifies which witness (private) fields a call discloses to the public ledger." },
  { name: "Proving-mode notice", detail: "Midnight-specific: tells you whether the ZK proof is generated locally or by a delegated proof server." },
  { name: "Spend policy limit", detail: "Checks a proposed spend against the on-chain per-transaction and per-day caps." },
];

const LEDGER_FIELDS = [
  ["status", "PolicyStatus", "ACTIVE / PAUSED / REVOKED"],
  ["ownerCommitment", "Bytes<32>", "Commitment to the policy owner's secret key"],
  ["signerCommitment", "Bytes<32>", "Commitment to the authorized sub-signer's secret key"],
  ["merchant", "Bytes<32>", "Merchant / target identifier"],
  ["capPerTx", "Uint<64>", "Per-transaction spending cap"],
  ["capPerDay", "Uint<64>", "Per-period (day) spending cap"],
  ["periodStart", "Uint<64>", "Start of the current spending period"],
  ["spentThisPeriod", "Uint<64>", "Amount spent in the current period"],
];

export default function DocsPage() {
  return (
    <div className="px-5 py-16 sm:px-8">
      <Container className="max-w-3xl">
        <Eyebrow>Architecture</Eyebrow>
        <h1 className="font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          How Baret works on Midnight.
        </h1>
        <p className="mt-3 text-muted">
          A pre-signature risk analysis and spending-policy firewall, designed around Midnight's
          Ledger / Circuit / Witness / dApp Connector model.
        </p>

        <Section title="Risk detectors">
          <div className="space-y-3">
            {DETECTORS.map((d) => (
              <div key={d.name} className="rounded-lg border border-border bg-card p-4">
                <div className="font-mono text-sm font-semibold">{d.name}</div>
                <p className="mt-1 text-sm text-muted">{d.detail}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="merchant-spend-policy contract">
          <p className="text-sm text-muted">
            The Ledger (public, on-chain state) tracked by the contract:
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/60 text-left">
                  <th className="p-3 font-medium">Field</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER_FIELDS.map(([f, t, m]) => (
                  <tr key={f} className="border-b border-border font-mono text-xs last:border-0">
                    <td className="p-3 text-foreground">{f}</td>
                    <td className="p-3 text-muted">{t}</td>
                    <td className="p-3 font-sans text-muted">{m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-sm text-muted">
            Ownership is checked with a <span className="text-foreground">commitment scheme</span> — the
            witness reveals a secret key, the circuit re-derives its commitment and compares it against
            the stored one — rather than a raw public-key comparison, which is not sound inside a ZK
            circuit. Circuits: <code className="text-foreground">setPolicy</code>,{" "}
            <code className="text-foreground">authorizeSpend</code>, <code className="text-foreground">pause</code>,{" "}
            <code className="text-foreground">resume</code>, <code className="text-foreground">revoke</code>.
          </p>
        </Section>

        <Section title="x402 payment flow">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted marker:text-primary">
            <li>The page's fetch() gets an HTTP 402 response.</li>
            <li>The extension decodes the PaymentRequirements.</li>
            <li>The policy engine evaluates the request against the on-chain policy.</li>
            <li>Within caps: signs silently in the background. Outside caps: shows a risk preview and waits for approval.</li>
            <li>The circuit call is signed via the dApp Connector API (proof generated locally or delegated).</li>
            <li>The signed payment replays to the server via a PAYMENT-SIGNATURE header.</li>
            <li>Our own Midnight-native facilitator verifies and settles it — no official Midnight x402 facilitator exists yet, so this project runs its own.</li>
            <li>The transaction lands; a receipt is returned.</li>
          </ol>
        </Section>

        <Section title="Known limitations">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted marker:text-primary">
            <li>The extension doesn't yet decode circuit-level detail from opaque signData/balanceTransaction payloads — unrecognized shapes default safely to a blind-sign warning.</li>
            <li>Real ZK proof generation requires an ADX-capable CPU; verified working on GitHub Actions and Render, not on every dev machine.</li>
            <li>Real testnet deployment is currently blocked by Midnight preprod faucet reliability issues, external to this project.</li>
          </ul>
        </Section>
      </Container>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <h2 className="font-display text-xl font-semibold uppercase tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
