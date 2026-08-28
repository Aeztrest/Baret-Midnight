import type { AnalysisContext, Detector, TransactionIntent } from "./types.js";

function circuitKey(intent: TransactionIntent): string {
  return `${intent.contractAddress}:${intent.circuitId}`;
}

/** Baret: "Blind sign riski" → bilinmeyen contract+circuit kombinasyonu uyarısı. */
export const blindSignRisk: Detector = (intent, ctx) => {
  if (ctx.knownCircuits.has(circuitKey(intent))) return null;
  return {
    id: "blind-sign",
    severity: "critical",
    title: "Bilinmeyen sözleşme çağrısı",
    detail: `${intent.contractAddress} adresindeki "${intent.circuitId}" circuit'i onaylı listede değil. Ne yaptığını doğrulamadan imzalama.`,
  };
};

/** Baret: "Approval drainer" → sınırsız/aşırı yüksek harcama yetkisi isteyen çağrılar. */
export const unlimitedApprovalRisk: Detector = (intent) => {
  if (intent.circuitId !== "setPolicy") return null;
  const cap = intent.args.newCapPerTx;
  if (typeof cap !== "number") return null;
  const UNREASONABLY_HIGH = 1_000_000_000;
  if (cap >= UNREASONABLY_HIGH) {
    return {
      id: "unlimited-approval",
      severity: "critical",
      title: "Sınırsıza yakın harcama limiti isteniyor",
      detail: `Bu politika işlem başına ${cap} birime kadar harcama yetkisi istiyor. Bu, fiilen sınırsız onay demektir.`,
    };
  }
  return null;
};

/** Baret: "Agentic x402" → bir AI ajanın kullanıcı onayı olmadan mikro-ödeme yapması. */
export const agenticX402Risk: Detector = (intent) => {
  if (intent.initiator !== "agent") return null;
  if (intent.circuitId !== "authorizeSpend") return null;
  return {
    id: "agentic-x402",
    severity: "warning",
    title: "Otonom ajan ödemesi",
    detail: "Bu ödeme bir insan tarafından değil, otomatik bir ajan tarafından tetiklendi. Politika limitleri içinde kalsa bile gözden geçir.",
  };
};

/** Baret: "Denge değişimleri analizi" → simüle edilmiş bakiye deltasını özetler. */
export const balanceDeltaSummary: Detector = (_intent, ctx) => {
  const meaningful = ctx.balanceDeltas.filter((d) => d.before !== d.after);
  if (meaningful.length === 0) return null;
  const lines = meaningful
    .map((d) => `${d.asset}: ${d.before} → ${d.after}`)
    .join(", ");
  return {
    id: "balance-delta",
    severity: "info",
    title: "Bakiye değişimi",
    detail: lines,
  };
};

/** Baret: "Kontrat etkileşimleri izleme" → zincirleme contract-to-contract çağrıları. */
export const contractInteractionTrace: Detector = (_intent, ctx) => {
  if (ctx.calledContracts.length === 0) return null;
  return {
    id: "contract-interactions",
    severity: "info",
    title: "Zincirleme sözleşme çağrıları",
    detail: `Bu işlem şu sözleşmeleri de çağırıyor: ${ctx.calledContracts.join(", ")}`,
  };
};

/** YENİ (Midnight'a özgü): disclose() ile açığa çıkan witness verisi uyarısı. */
export const disclosureRisk: Detector = (intent) => {
  const witnessDisclosures = intent.disclosures.filter((d) => d.source === "witness");
  if (witnessDisclosures.length === 0) return null;
  const fields = witnessDisclosures.map((d) => d.field).join(", ");
  return {
    id: "disclosure",
    severity: "warning",
    title: "Private veri ifşa ediliyor",
    detail: `Bu işlem şu private (witness) alanları public ledger'a yazıyor: ${fields}. İmzaladıktan sonra bu bilgi herkese açık olur.`,
  };
};

/** YENİ (Midnight'a özgü): proof lokal mi yoksa delege mi üretiliyor bildirimi. */
export const provingModeNotice: Detector = (intent) => {
  if (intent.provingMode !== "delegated") return null;
  return {
    id: "proving-mode",
    severity: "info",
    title: "Kanıt üretimi devredildi",
    detail: "Bu işlemin ZK kanıtı senin cihazında değil, harici bir proof server tarafından üretilecek.",
  };
};

/** Politika bazlı harcama limiti kontrolü (per-tx / per-day cap). */
export const spendPolicyLimitRisk: Detector = (intent, ctx) => {
  if (intent.circuitId !== "authorizeSpend" || !ctx.policy) return null;
  const amount = intent.args.amount;
  if (typeof amount !== "number") return null;
  const { policy } = ctx;

  if (policy.status !== "ACTIVE") {
    return {
      id: "policy-inactive",
      severity: "critical",
      title: "Politika aktif değil",
      detail: `Politika durumu "${policy.status}". Bu işlem zaten sözleşme tarafından reddedilecek.`,
    };
  }
  if (BigInt(amount) > policy.capPerTx) {
    return {
      id: "over-per-tx-cap",
      severity: "critical",
      title: "İşlem başına limit aşıldı",
      detail: `İstenen tutar (${amount}) işlem başı limiti (${policy.capPerTx}) aşıyor.`,
    };
  }
  if (policy.spentThisPeriod + BigInt(amount) > policy.capPerDay) {
    return {
      id: "over-per-day-cap",
      severity: "critical",
      title: "Günlük limit aşıldı",
      detail: `Bu dönemde harcanan (${policy.spentThisPeriod}) + istenen (${amount}), günlük limiti (${policy.capPerDay}) aşıyor.`,
    };
  }
  return null;
};

export const allDetectors: Detector[] = [
  blindSignRisk,
  unlimitedApprovalRisk,
  agenticX402Risk,
  spendPolicyLimitRisk,
  balanceDeltaSummary,
  contractInteractionTrace,
  disclosureRisk,
  provingModeNotice,
];
