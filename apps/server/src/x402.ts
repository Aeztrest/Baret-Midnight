// Midnight-native x402 "facilitator" (dev/demo). Resmi x402 ekosisteminde Midnight desteği
// henüz yok (EVM/Solana ağırlıklı) — bkz. docs/01-feature-spec.md §3.
// Bu modül kendi facilitator'ımızı temsil ediyor: gelen ödeme yetkilendirmesini
// merchant-spend-policy sözleşmesinin GERÇEK (derlenmiş) mantığına karşı değerlendirip
// "gölge defter"i (PolicySimulator) günceller.
//
// BİLİNEN SINIRLAMA (demo-only): Gerçek mimaride circuit witness'ları (signerSk) hiçbir zaman
// ağ üzerinden geçmez — cüzdan tarafında lokal olarak imzalanır/kanıtlanır, sunucu sadece
// bitmiş kanıtı doğrular. Bu makinede istemci tarafı proof üretimi de mümkün olmadığı için
// (Faz 0 — ADX kısıtı), bu endpoint'ler geçici olarak hem cüzdanın witness-çalıştırma rolünü
// hem facilitator'ın doğrulama rolünü üstleniyor. Gerçek testnet entegrasyonuna geçilince bu
// endpoint sadece bitmiş kanıtları doğrulayan bir role küçülecek.

import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import { PolicySimulator, type PolicyLedgerView } from "@baret-midnight/merchant-spend-policy";
import { analyzeTransaction, type AnalysisContext, type TransactionIntent } from "@baret-midnight/policy-engine";

interface StoredPolicy {
  simulator: PolicySimulator;
  merchant: string;
}

const policies = new Map<string, StoredPolicy>();

function hexToBytes(hex: string): Uint8Array {
  return new Uint8Array(Buffer.from(hex, "hex"));
}

function serializeLedger(l: PolicyLedgerView) {
  return {
    status: ["ACTIVE", "PAUSED", "REVOKED"][l.status],
    capPerTx: l.capPerTx.toString(),
    capPerDay: l.capPerDay.toString(),
    mandateSeconds: l.mandateSeconds.toString(),
    periodStart: l.periodStart.toString(),
    spentThisPeriod: l.spentThisPeriod.toString(),
  };
}

interface CreatePolicyBody {
  ownerSk: string;
  signerSk: string;
  merchant: string;
  capPerTx: string;
  capPerDay: string;
  mandateSeconds: string;
}

interface PayBody {
  amount: string;
  signerSk: string;
  initiator?: "user" | "agent";
}

export function registerX402Routes(app: FastifyInstance) {
  app.post<{ Body: CreatePolicyBody }>("/x402/policies", async (request, reply) => {
    const { ownerSk, signerSk, merchant, capPerTx, capPerDay, mandateSeconds } = request.body;
    const simulator = new PolicySimulator(BigInt(Math.floor(Date.now() / 1000)));
    const ledger = await simulator.deploy(
      hexToBytes(merchant),
      BigInt(capPerTx),
      BigInt(capPerDay),
      BigInt(mandateSeconds),
      hexToBytes(ownerSk),
      hexToBytes(signerSk)
    );
    const policyId = randomUUID();
    policies.set(policyId, { simulator, merchant });
    return reply.code(201).send({ policyId, ledger: serializeLedger(ledger) });
  });

  app.get<{ Params: { policyId: string } }>("/x402/resource/:policyId", async (request, reply) => {
    const stored = policies.get(request.params.policyId);
    if (!stored) return reply.code(404).send({ error: "Bilinmeyen policyId" });

    const paymentHeader = request.headers["payment-signature"];
    if (!paymentHeader || typeof paymentHeader !== "string") {
      return reply.code(402).send({
        error: "Payment Required",
        requirements: {
          policyId: request.params.policyId,
          asset: "tDUST",
          facilitator: "self",
          header: "payment-signature",
          bodyShape: { amount: "string", signerSk: "string (demo-only)" },
        },
      });
    }

    let payBody: PayBody;
    try {
      payBody = JSON.parse(paymentHeader) as PayBody;
    } catch {
      return reply.code(400).send({ error: "payment-signature JSON parse edilemedi" });
    }

    const amount = Number(payBody.amount);
    const ledgerBefore = stored.simulator.ledger();

    const intent: TransactionIntent = {
      contractAddress: request.params.policyId,
      circuitId: "authorizeSpend",
      args: { amount },
      disclosures: [{ field: "signerSecretKey", source: "witness" }],
      provingMode: "local",
      originSite: request.hostname,
      initiator: payBody.initiator ?? "agent",
    };
    const ctx: AnalysisContext = {
      knownCircuits: new Set([`${request.params.policyId}:authorizeSpend`]),
      policy: {
        status: ["ACTIVE", "PAUSED", "REVOKED"][ledgerBefore.status] as "ACTIVE" | "PAUSED" | "REVOKED",
        capPerTx: ledgerBefore.capPerTx,
        capPerDay: ledgerBefore.capPerDay,
        spentThisPeriod: ledgerBefore.spentThisPeriod,
      },
      balanceDeltas: [],
      calledContracts: [],
    };
    const analysis = analyzeTransaction(intent, ctx);

    try {
      const ledgerAfter = await stored.simulator.call("authorizeSpend", [BigInt(amount)], {
        signerSk: hexToBytes(payBody.signerSk),
      });
      return reply.send({
        content: "Bu, politika limitleri içinde ödemesi yapılmış korumalı kaynaktır.",
        receipt: {
          txId: randomUUID(),
          amount,
          ledger: serializeLedger(ledgerAfter),
        },
        analysis: { findings: analysis.findings, highestSeverity: analysis.highestSeverity },
      });
    } catch (err) {
      return reply.code(402).send({
        error: "Ödeme reddedildi",
        reason: err instanceof Error ? err.message : String(err),
        analysis: { findings: analysis.findings, highestSeverity: analysis.highestSeverity },
      });
    }
  });
}
