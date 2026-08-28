import { describe, expect, it } from "vitest";
import { analyzeTransaction } from "../src/index.js";
import type { AnalysisContext, TransactionIntent } from "../src/types.js";

const baseIntent: TransactionIntent = {
  contractAddress: "0xPOLICY",
  circuitId: "authorizeSpend",
  args: { amount: 10 },
  disclosures: [],
  provingMode: "local",
  originSite: "shop.example",
  initiator: "user",
};

const baseCtx: AnalysisContext = {
  knownCircuits: new Set(["0xPOLICY:authorizeSpend", "0xPOLICY:setPolicy"]),
  policy: { status: "ACTIVE", capPerTx: 100n, capPerDay: 500n, spentThisPeriod: 0n },
  balanceDeltas: [],
  calledContracts: [],
};

describe("blindSignRisk", () => {
  it("bilinmeyen circuit için critical uyarı verir", () => {
    const result = analyzeTransaction(
      { ...baseIntent, contractAddress: "0xUNKNOWN" },
      baseCtx
    );
    expect(result.findings.some((f) => f.id === "blind-sign")).toBe(true);
    expect(result.highestSeverity).toBe("critical");
  });

  it("bilinen circuit için uyarı vermez", () => {
    const result = analyzeTransaction(baseIntent, baseCtx);
    expect(result.findings.some((f) => f.id === "blind-sign")).toBe(false);
  });
});

describe("spendPolicyLimitRisk", () => {
  it("per-tx limiti aşan işlemi yakalar", () => {
    const result = analyzeTransaction(
      { ...baseIntent, args: { amount: 1000 } },
      baseCtx
    );
    expect(result.findings.some((f) => f.id === "over-per-tx-cap")).toBe(true);
    expect(result.requiresManualApproval).toBe(true);
  });

  it("per-day limiti aşan işlemi yakalar", () => {
    const ctx: AnalysisContext = {
      ...baseCtx,
      policy: { status: "ACTIVE", capPerTx: 100n, capPerDay: 500n, spentThisPeriod: 495n },
    };
    const result = analyzeTransaction({ ...baseIntent, args: { amount: 10 } }, ctx);
    expect(result.findings.some((f) => f.id === "over-per-day-cap")).toBe(true);
  });

  it("limit içindeki işlemi geçirir", () => {
    const result = analyzeTransaction(baseIntent, baseCtx);
    expect(result.findings.some((f) => f.severity === "critical")).toBe(false);
  });

  it("paused politika için critical uyarı verir", () => {
    const ctx: AnalysisContext = {
      ...baseCtx,
      policy: { status: "PAUSED", capPerTx: 100n, capPerDay: 500n, spentThisPeriod: 0n },
    };
    const result = analyzeTransaction(baseIntent, ctx);
    expect(result.findings.some((f) => f.id === "policy-inactive")).toBe(true);
  });
});

describe("disclosureRisk", () => {
  it("witness kaynaklı disclosure için uyarı verir", () => {
    const result = analyzeTransaction(
      {
        ...baseIntent,
        disclosures: [{ field: "signerSecretKey", source: "witness" }],
      },
      baseCtx
    );
    expect(result.findings.some((f) => f.id === "disclosure")).toBe(true);
  });

  it("sadece parametre kaynaklı disclosure için uyarı vermez", () => {
    const result = analyzeTransaction(
      { ...baseIntent, disclosures: [{ field: "amount", source: "parameter" }] },
      baseCtx
    );
    expect(result.findings.some((f) => f.id === "disclosure")).toBe(false);
  });
});

describe("agenticX402Risk", () => {
  it("ajan başlatılı ödeme için warning verir", () => {
    const result = analyzeTransaction({ ...baseIntent, initiator: "agent" }, baseCtx);
    expect(result.findings.some((f) => f.id === "agentic-x402")).toBe(true);
  });
});

describe("unlimitedApprovalRisk", () => {
  it("aşırı yüksek cap isteyen setPolicy çağrısını yakalar", () => {
    const result = analyzeTransaction(
      {
        ...baseIntent,
        circuitId: "setPolicy",
        args: { newCapPerTx: 5_000_000_000 },
      },
      baseCtx
    );
    expect(result.findings.some((f) => f.id === "unlimited-approval")).toBe(true);
  });
});

describe("provingModeNotice", () => {
  it("delegated proving için bilgi notu verir", () => {
    const result = analyzeTransaction({ ...baseIntent, provingMode: "delegated" }, baseCtx);
    expect(result.findings.some((f) => f.id === "proving-mode")).toBe(true);
  });
});
