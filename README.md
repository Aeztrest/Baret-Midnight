# Baret for Midnight

A pre-signature transaction firewall for Midnight wallets, built natively for Midnight's
privacy architecture: a real Compact smart contract, a chain-aware risk-detector engine, a
self-hosted x402 micropayment facilitator, and a browser extension that intercepts wallet calls
before you sign.

Before you approve a transaction, Baret simulates it, tells you in plain language what it does
and — because Midnight is a privacy chain — what private data it's about to disclose to the
public ledger. On top of that, it enforces per-site spending policies (per-transaction and daily
caps, pause/resume/revoke) so a compromised or overly-permissive dApp can't drain your wallet.

Design rationale and full feature spec: [`docs/01-feature-spec.md`](docs/01-feature-spec.md).

## Why this matters on Midnight specifically

Midnight keeps contract state split between a public ledger and private, off-chain witness data,
disclosing only what a circuit explicitly reveals. That's a strictly harder thing for a user to
reason about at signing time than a fully transparent chain — you can't just read the transaction
off a block explorer to see what it does. Baret's risk engine is built around that: alongside the
usual checks (unknown contracts, unlimited approvals, unsafe balance changes), it flags exactly
which private fields a transaction is about to disclose, and whether the proof for it is being
generated locally or delegated to a remote proof server.

## Packages

| Package | What it does |
|---|---|
| `contracts/merchant-spend-policy` | The Compact contract (Ledger/Circuits/Witnesses) enforcing spending policies, plus a proof-free integration test suite that runs the real compiled contract logic |
| `packages/policy-engine` | Chain-aware risk detectors (blind-sign, unlimited-approval, disclosure, agentic-payment, etc.) |
| `apps/server` | Fastify service: `/v1/analyze` (risk analysis) and `/x402/*` (a self-hosted Midnight-native x402 facilitator) |
| `apps/extension` | MV3 browser extension: intercepts `window.midnight.lace` calls, shows a pre-sign approval screen, manages per-site policies |
| `apps/showcase` | Marketing/docs site with a live, in-browser risk analyzer running the real `policy-engine` package |

## Quick start

```bash
pnpm install
pnpm -r test          # runs every package's test suite
cd apps/server && pnpm dev     # http://127.0.0.1:8787
cd apps/extension && node build.mjs   # builds ./dist, load unpacked at chrome://extensions
cd apps/showcase && pnpm dev   # http://localhost:5175
```

Deployment: `Dockerfile` + `render.yaml` at the repo root deploy `apps/server` as a Render web
service; `vercel.json` deploys `apps/showcase` as a static Vercel site (set the Vercel project's
root directory to the repo root, not `apps/showcase`, so the pnpm workspace install works).

## Known limitation (hardware)

This project was built on a machine whose CPU (Haswell-era, no ADX instruction set) cannot run
real ZK proof generation — `zkir` crashes with an illegal instruction on it. As a result:
- Contract logic is verified against the **real compiled Compact code**, using
  `@midnight-ntwrk/compact-runtime`'s state-transition APIs without generating proofs — a genuine
  correctness check, not a mock.
- Real testnet deployment and real proof generation are deferred until an ADX-capable environment
  is used (a modern cloud VM, e.g. the Render deployment above, would work).
