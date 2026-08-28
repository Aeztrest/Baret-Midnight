import Fastify from "fastify";
import {
  analyzeTransaction,
  type AnalysisContext,
  type TransactionIntent,
} from "@baret-midnight/policy-engine";
import { registerX402Routes } from "./x402.js";

interface AnalyzeRequestBody {
  intent: TransactionIntent;
  context: {
    knownCircuits: string[];
    policy?: { status: "ACTIVE" | "PAUSED" | "REVOKED"; capPerTx: string; capPerDay: string; spentThisPeriod: string };
    balanceDeltas: { asset: string; before: string; after: string }[];
    calledContracts: string[];
  };
}

const app = Fastify({ logger: true });

app.post<{ Body: AnalyzeRequestBody }>("/v1/analyze", async (request, reply) => {
  const { intent, context } = request.body;

  const ctx: AnalysisContext = {
    knownCircuits: new Set(context.knownCircuits),
    policy: context.policy
      ? {
          status: context.policy.status,
          capPerTx: BigInt(context.policy.capPerTx),
          capPerDay: BigInt(context.policy.capPerDay),
          spentThisPeriod: BigInt(context.policy.spentThisPeriod),
        }
      : undefined,
    balanceDeltas: context.balanceDeltas.map((d) => ({
      asset: d.asset,
      before: BigInt(d.before),
      after: BigInt(d.after),
    })),
    calledContracts: context.calledContracts,
  };

  const result = analyzeTransaction(intent, ctx);
  return reply.send({
    findings: result.findings,
    highestSeverity: result.highestSeverity,
    requiresManualApproval: result.requiresManualApproval,
  });
});

registerX402Routes(app);

app.get("/healthz", async () => ({ status: "ok" }));

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
