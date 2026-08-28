import type { AnalysisContext, TransactionIntent } from "@baret-midnight/policy-engine";

export interface Scenario {
  slug: string;
  siteName: string;
  tag: string;
  threat: string;
  description: string;
  intent: TransactionIntent;
  context: AnalysisContext;
}

const baseContext = (overrides: Partial<AnalysisContext> = {}): AnalysisContext => ({
  knownCircuits: new Set(["0xPOLICY:authorizeSpend"]),
  policy: { status: "ACTIVE", capPerTx: 100n, capPerDay: 500n, spentThisPeriod: 0n },
  balanceDeltas: [],
  calledContracts: [],
  ...overrides,
});

export const SCENARIOS: Scenario[] = [
  {
    slug: "driftswap",
    siteName: "DriftSwap",
    tag: "DeFi swap",
    threat: "Unlimited approval",
    description: "A DEX asks you to approve a spending policy with a per-transaction cap so high it's effectively unlimited.",
    intent: {
      contractAddress: "0xDRIFTSWAP",
      circuitId: "setPolicy",
      args: { newCapPerTx: 5_000_000_000 },
      disclosures: [],
      provingMode: "local",
      originSite: "driftswap.example",
      initiator: "user",
    },
    context: baseContext({ knownCircuits: new Set(["0xDRIFTSWAP:setPolicy"]) }),
  },
  {
    slug: "glyphmint",
    siteName: "GlyphMint",
    tag: "NFT mint",
    threat: "Blind sign risk",
    description: "A mint page routes your transaction through a contract that isn't on any known/whitelisted list.",
    intent: {
      contractAddress: "0xUNVERIFIED_MINTER",
      circuitId: "authorizeSpend",
      args: { amount: 20 },
      disclosures: [],
      provingMode: "local",
      originSite: "glyphmint.example",
      initiator: "user",
    },
    context: baseContext(),
  },
  {
    slug: "duskstake",
    siteName: "DuskStake",
    tag: "Liquid staking",
    threat: "Private data disclosure",
    description: "A staking flow discloses a witness (private) field to the public ledger as part of authorization.",
    intent: {
      contractAddress: "0xPOLICY",
      circuitId: "authorizeSpend",
      args: { amount: 40 },
      disclosures: [{ field: "signerSecretKey", source: "witness" }],
      provingMode: "delegated",
      originSite: "duskstake.example",
      initiator: "user",
    },
    context: baseContext(),
  },
  {
    slug: "nightclaim",
    siteName: "NightClaim",
    tag: "Airdrop claim",
    threat: "Agentic x402 payment",
    description: "An autonomous agent triggers a claim-fee micro-payment on your behalf, without a direct click.",
    intent: {
      contractAddress: "0xPOLICY",
      circuitId: "authorizeSpend",
      args: { amount: 15 },
      disclosures: [],
      provingMode: "local",
      originSite: "nightclaim.example",
      initiator: "agent",
    },
    context: baseContext(),
  },
  {
    slug: "vaultlaunch",
    siteName: "VaultLaunch",
    tag: "Token launch",
    threat: "Daily cap exceeded",
    description: "A launchpad requests a contribution that would push you past your own daily spending cap.",
    intent: {
      contractAddress: "0xPOLICY",
      circuitId: "authorizeSpend",
      args: { amount: 150 },
      disclosures: [],
      provingMode: "local",
      originSite: "vaultlaunch.example",
      initiator: "user",
    },
    context: baseContext({ policy: { status: "ACTIVE", capPerTx: 200n, capPerDay: 500n, spentThisPeriod: 400n } }),
  },
];
