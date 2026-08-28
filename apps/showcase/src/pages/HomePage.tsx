import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldAlert,
  ShieldCheck,
  Eye,
  Lock,
  ArrowRight,
  Wallet,
  Radar,
  KeyRound,
  Server,
  Sparkles,
} from "lucide-react";
import { Container, Eyebrow } from "../components/Chrome";

const DETECTORS = [
  "Blind sign risk",
  "Unlimited approval",
  "Agentic x402 payment",
  "Balance delta simulation",
  "Contract interaction trace",
  "Private data disclosure",
  "Proving-mode notice",
  "Per-site spend cap",
];

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.5, delay },
  };
}

export default function HomePage() {
  return (
    <div>
      <Hero />
      <DetectorMarquee />
      <Pillars />
      <DisclosureSection />
      <ComparisonSection />
      <FaqSection />
      <FinalCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-28 sm:px-8">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgb(var(--border)) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow>Pre-sign transaction firewall</Eyebrow>
          <motion.h1
            {...fadeUp()}
            className="text-balance font-display text-4xl font-semibold uppercase leading-[1.05] tracking-[-0.02em] sm:text-5xl md:text-6xl"
          >
            Read the transaction<span className="text-primary">.</span>
            <br />
            Before you sign it<span className="text-primary">.</span>
          </motion.h1>
          <motion.p {...fadeUp(0.1)} className="mt-6 max-w-xl text-balance text-lg text-muted">
            Baret simulates every Midnight transaction before your wallet signs it, tells you in plain
            language what it does — and what private data it's about to disclose to the public ledger.
            Per-site spending caps enforced by a real Compact contract, not a browser promise.
          </motion.p>
          <motion.div {...fadeUp(0.2)} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/demo"
              className="group inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Try the live risk analyzer
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/install"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold transition-colors hover:border-foreground/30"
            >
              Install the extension
            </Link>
          </motion.div>
          <motion.p {...fadeUp(0.3)} className="mt-6 font-mono text-xs uppercase tracking-wider text-muted">
            Built natively for Midnight — Compact contracts, dApp Connector API, ZK disclosure model.
          </motion.p>
        </div>
        <motion.div {...fadeUp(0.15)} className="lg:col-span-5">
          <RiskPreviewMock />
        </motion.div>
      </Container>
    </section>
  );
}

function RiskPreviewMock() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/10">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ShieldAlert size={16} className="text-amber-500" />
        <span className="font-mono text-xs uppercase tracking-wider text-muted">Pre-sign review</span>
      </div>
      <div className="space-y-3 p-4">
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Eye size={14} /> Private data disclosure
          </div>
          <p className="mt-1 text-xs text-muted">
            This call writes <code className="text-foreground">signerSecretKey</code> to the public ledger via disclose().
          </p>
        </div>
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
            <ShieldAlert size={14} /> Over per-transaction cap
          </div>
          <p className="mt-1 text-xs text-muted">Requested 200, policy allows 100 per transaction.</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/60 p-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Lock size={14} className="text-primary" /> Proving mode
          </div>
          <p className="mt-1 text-xs text-muted">Delegated — proof generated by a remote proof server.</p>
        </div>
        <div className="flex gap-2 pt-1">
          <button className="flex-1 rounded-md border border-border py-2 text-xs font-semibold">Reject</button>
          <button className="flex-1 rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground">
            Approve anyway
          </button>
        </div>
      </div>
    </div>
  );
}

function DetectorMarquee() {
  return (
    <div className="border-y border-border/60 bg-secondary/40 py-3">
      <div className="flex animate-[scroll_28s_linear_infinite] gap-8 whitespace-nowrap font-mono text-xs uppercase tracking-widest text-muted">
        {[...DETECTORS, ...DETECTORS].map((d, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-primary" />
            {d}
          </span>
        ))}
      </div>
      <style>{`@keyframes scroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

const PILLARS = [
  {
    icon: Radar,
    title: "Simulate before you sign",
    body: "Every dApp Connector call is intercepted and run through 8 risk detectors — unknown contracts, unlimited approvals, agentic payments — before it ever reaches your wallet.",
  },
  {
    icon: Wallet,
    title: "Per-site spending policy",
    body: "A real Compact contract enforces per-transaction and per-day caps on-chain. Pause or revoke a site's access in one click, from a real deployed policy — not local storage alone.",
  },
  {
    icon: Server,
    title: "Your own x402 facilitator",
    body: "Micropayments go through a policy engine before they're authorized. Within caps, they settle silently; outside caps, you see exactly why before anything moves.",
  },
];

function Pillars() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <Container>
        <div className="grid gap-8 md:grid-cols-3">
          {PILLARS.map((p, i) => (
            <motion.div key={p.title} {...fadeUp(i * 0.08)} className="rounded-xl border border-border bg-card p-6">
              <p.icon size={22} className="text-primary" />
              <h3 className="mt-4 font-display text-lg font-semibold">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function DisclosureSection() {
  return (
    <section className="border-y border-border/60 bg-secondary/30 px-5 py-24 sm:px-8">
      <Container className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <Eyebrow>Midnight-specific</Eyebrow>
          <h2 className="text-balance font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
            Privacy chains hide a new kind of risk.
          </h2>
          <p className="mt-4 max-w-lg text-muted">
            Midnight splits contract state into a public ledger and private, off-chain witness data —
            disclosing only what a circuit explicitly reveals. You can't just read a block explorer to
            see what a transaction does. Baret's disclosure detector tells you exactly which private
            fields a call is about to make public, before you sign.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Which witness fields get written to the public ledger via disclose()",
              "Whether the ZK proof is generated locally or by a delegated proof server",
              "Whether the target circuit is on your known/whitelisted list",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
                <span className="text-muted">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:col-span-6">
          <div className="rounded-xl border border-border bg-card p-6 font-mono text-xs leading-relaxed">
            <div className="text-muted">{"// merchant-spend-policy.compact"}</div>
            <div className="mt-2 text-foreground">
              export circuit authorizeSpend(amount: Uint&lt;64&gt;): [] {"{"}
            </div>
            <div className="pl-4 text-muted">assert(signerCommitmentOf(disclose(signerSecretKey())) == ...);</div>
            <div className="pl-4 text-muted">assert(status == PolicyStatus.ACTIVE, ...);</div>
            <div className="pl-4 text-muted">assert(amount &lt;= capPerTx, ...);</div>
            <div className="pl-4 text-primary">{"// real, compiled, tested against the actual runtime"}</div>
            <div className="text-foreground">{"}"}</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function ComparisonSection() {
  const rows = [
    ["Simulates before signing", true, false],
    ["Flags private-data disclosure", true, false],
    ["On-chain per-site spend caps", true, false],
    ["Blocks unlimited approvals", true, "sometimes"],
    ["Explains agentic x402 payments", true, false],
  ];
  return (
    <section className="px-5 py-24 sm:px-8">
      <Container>
        <Eyebrow>Why a firewall</Eyebrow>
        <h2 className="max-w-2xl text-balance font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          A default wallet trusts the dApp. Baret doesn't.
        </h2>
        <div className="mt-10 overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/60 text-left">
                <th className="p-4 font-medium">Capability</th>
                <th className="p-4 font-medium text-primary">Baret</th>
                <th className="p-4 font-medium text-muted">Default wallet</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([label, baret, def]) => (
                <tr key={label as string} className="border-b border-border last:border-0">
                  <td className="p-4 text-muted">{label as string}</td>
                  <td className="p-4">
                    <ShieldCheck size={16} className="text-primary" />
                  </td>
                  <td className="p-4 text-xs text-muted">{def === false ? "—" : def === true ? "yes" : def}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
}

const FAQS = [
  {
    q: "Does Baret hold my keys?",
    a: "No. Baret sits between the dApp and your wallet's dApp Connector API — it never sees or stores your secret keys. Signing still happens in your wallet.",
  },
  {
    q: "What happens if I approve outside my policy?",
    a: "You can always override — Baret shows you the risk, it doesn't take away your keys. Overrides are logged so you can review them later.",
  },
  {
    q: "Is the spending policy enforced on-chain or just in the extension?",
    a: "Both. The extension gives you the fast, local pre-sign check; the merchant-spend-policy Compact contract enforces the actual caps on-chain via authorizeSpend, so the limit holds even if the extension isn't running.",
  },
  {
    q: "What is 'agentic x402' risk?",
    a: "x402 lets AI agents make autonomous micro-payments. Baret flags any payment initiated by an agent rather than a direct user action, even if it's within your spending caps, so you can review the pattern.",
  },
];

function FaqSection() {
  return (
    <section className="border-t border-border/60 px-5 py-24 sm:px-8">
      <Container className="max-w-3xl">
        <Eyebrow>FAQ</Eyebrow>
        <h2 className="font-display text-3xl font-semibold uppercase tracking-tight">Questions, answered plainly.</h2>
        <div className="mt-8 divide-y divide-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
                {f.q}
                <Sparkles size={14} className="text-primary opacity-0 transition-opacity group-open:opacity-100" />
              </summary>
              <p className="mt-3 text-sm text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <Container className="rounded-2xl border border-border bg-card p-10 text-center sm:p-16">
        <KeyRound size={28} className="mx-auto text-primary" />
        <h2 className="mx-auto mt-4 max-w-xl text-balance font-display text-3xl font-semibold uppercase tracking-tight sm:text-4xl">
          Your keys move only when you understand why.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/demo"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Try the live risk analyzer
          </Link>
          <Link
            to="/install"
            className="inline-flex items-center gap-2 rounded-md border border-border px-6 py-3.5 text-sm font-semibold"
          >
            Install the extension
          </Link>
        </div>
      </Container>
    </section>
  );
}
