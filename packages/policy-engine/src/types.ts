// Zincirden bağımsız temel tipler. Bkz. docs/01-feature-spec.md §1.
// Midnight'ın circuit/ledger/witness/disclosure kavramlarına göre modellenmiştir.

export type ProvingMode = "local" | "delegated";

export interface DisclosedField {
  /** Circuit içinde disclose() ile açığa çıkarılan alanın adı. */
  field: string;
  /** Bu alanın kaynağı bir witness (private state) mi yoksa zaten public bir circuit parametresi mi. */
  source: "witness" | "parameter";
}

export interface TransactionIntent {
  /** Çağrılan sözleşmenin adresi. */
  contractAddress: string;
  /** Çağrılan circuit'in adı (ör. "authorizeSpend"). */
  circuitId: string;
  /** Circuit'e geçilen public argümanlar. */
  args: Record<string, string | number | boolean>;
  /** Derleyicinin/driver'ın bildirdiği, bu çağrıda disclose() edilecek alanlar. */
  disclosures: DisclosedField[];
  /** Bu işlemin ZK kanıtı nerede üretilecek. */
  provingMode: ProvingMode;
  /** İşlemi tetikleyen site (per-site politika için). */
  originSite: string;
  /** İşlemi bir insanın mı yoksa otonom bir ajanın mı başlattığı (x402 agentic akışı için). */
  initiator: "user" | "agent";
}

export type PolicyStatus = "ACTIVE" | "PAUSED" | "REVOKED";

export interface PolicyRecord {
  status: PolicyStatus;
  capPerTx: bigint;
  capPerDay: bigint;
  spentThisPeriod: bigint;
}

export interface BalanceDelta {
  asset: string;
  before: bigint;
  after: bigint;
}

export interface AnalysisContext {
  /** Bilinen/onaylı (whitelist) sözleşme adresi + circuit kombinasyonları. */
  knownCircuits: ReadonlySet<string>;
  /** İşlemin hedeflediği per-site/per-merchant politika kaydı, varsa. */
  policy?: PolicyRecord;
  /** Simüle edilmiş bakiye değişimleri (balanceTransaction eşdeğeri). */
  balanceDeltas: BalanceDelta[];
  /** Bu çağrının zincirleme olarak tetiklediği diğer contract-to-contract çağrıları. */
  calledContracts: string[];
}

export type Severity = "info" | "warning" | "critical";

export interface RiskFinding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export type Detector = (intent: TransactionIntent, ctx: AnalysisContext) => RiskFinding | null;
