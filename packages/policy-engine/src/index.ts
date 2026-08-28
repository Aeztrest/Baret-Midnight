import { allDetectors } from "./detectors.js";
import type { AnalysisContext, RiskFinding, TransactionIntent } from "./types.js";

export * from "./types.js";
export * from "./detectors.js";

export interface AnalysisResult {
  findings: RiskFinding[];
  highestSeverity: "info" | "warning" | "critical" | "none";
  requiresManualApproval: boolean;
}

const severityRank = { critical: 3, warning: 2, info: 1, none: 0 } as const;

/** Baret'in pre-sign analiz motorunun Midnight karşılığı: tüm dedektörleri çalıştırıp özetler. */
export function analyzeTransaction(
  intent: TransactionIntent,
  ctx: AnalysisContext
): AnalysisResult {
  const findings = allDetectors
    .map((detector) => detector(intent, ctx))
    .filter((f): f is RiskFinding => f !== null);

  const highestSeverity = findings.reduce<"info" | "warning" | "critical" | "none">(
    (acc, f) => (severityRank[f.severity] > severityRank[acc] ? f.severity : acc),
    "none"
  );

  return {
    findings,
    highestSeverity,
    requiresManualApproval: highestSeverity === "critical" || highestSeverity === "warning",
  };
}
