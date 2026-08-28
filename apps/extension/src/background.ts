// Service worker. content-bridge.ts'den gelen intercept isteklerini policy-engine ile
// analiz eder, gerekiyorsa bir onay penceresi açar ve kararı geri döndürür.
//
// BİLİNEN SINIRLAMA (v1): dApp Connector API (signData/balanceTransaction/submitTransaction)
// bu katmanda zaten kodlanmış/opak bir işlem nesnesi verir; "hangi circuit, hangi contract,
// hangi tutar" gibi anlamlı alanlara ulaşmak için Midnight'ın işlem/circuit-çağrısı encoding'ini
// çözen ayrı bir decoder gerekir. Bu henüz yazılmadı — decodeIntent() bu yüzden "best-effort" çalışıyor: tanıyabildiği alanları
// kullanır, tanıyamadığında güvenli varsayılan olarak "blind sign" riskiyle işaretleyip her
// zaman kullanıcı onayına düşürür. Faz 4 takip maddesi olarak docs'a not düşüldü.

import { analyzeTransaction, type AnalysisContext, type TransactionIntent } from "@baret-midnight/policy-engine";
import type {
  AnalyzeRuntimeRequest,
  AnalyzeRuntimeResponse,
  GetPendingRequestMessage,
  PendingApproval,
  ResolveInterceptMessage,
} from "./shared/messages.js";

const pendingResolvers = new Map<string, (res: AnalyzeRuntimeResponse) => void>();

const KNOWN_CIRCUITS_KEY = "baret:knownCircuits";
const SITE_POLICY_PREFIX = "baret:policy:";

async function getKnownCircuits(): Promise<Set<string>> {
  const stored = await chrome.storage.local.get(KNOWN_CIRCUITS_KEY);
  const list = (stored[KNOWN_CIRCUITS_KEY] as string[] | undefined) ?? [];
  return new Set(list);
}

interface RawArgShape {
  contractAddress?: string;
  circuitId?: string;
  amount?: number;
}

function decodeIntent(req: AnalyzeRuntimeRequest): TransactionIntent {
  const raw = (req.args[0] ?? {}) as RawArgShape;
  const recognizedShape = typeof raw === "object" && raw !== null && "circuitId" in raw;

  return {
    contractAddress: raw.contractAddress ?? "unknown",
    circuitId: recognizedShape ? (raw.circuitId as string) : `connector:${req.method}`,
    args: typeof raw.amount === "number" ? { amount: raw.amount } : {},
    disclosures: [],
    provingMode: "local",
    originSite: req.originSite,
    initiator: "user",
  };
}

async function analyze(req: AnalyzeRuntimeRequest): Promise<{ result: ReturnType<typeof analyzeTransaction>; intent: TransactionIntent }> {
  const intent = decodeIntent(req);
  const knownCircuits = await getKnownCircuits();
  const policyRaw = await chrome.storage.local.get(SITE_POLICY_PREFIX + req.originSite);
  const policy = policyRaw[SITE_POLICY_PREFIX + req.originSite] as AnalysisContext["policy"] | undefined;

  const ctx: AnalysisContext = {
    knownCircuits,
    policy,
    balanceDeltas: [],
    calledContracts: [],
  };

  return { result: analyzeTransaction(intent, ctx), intent };
}

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (isAnalyzeRequest(message)) {
    handleAnalyzeRequest(message).then(sendResponse);
    return true; // async response
  }
  if (isResolveMessage(message)) {
    const resolver = pendingResolvers.get(message.requestId);
    if (resolver) {
      pendingResolvers.delete(message.requestId);
      resolver({ decision: message.decision, reason: message.reason });
    }
    sendResponse({ ok: true });
    return false;
  }
  if (isGetPendingRequest(message)) {
    chrome.storage.local.get(`baret:pending:${message.requestId}`).then((stored) => {
      sendResponse(stored[`baret:pending:${message.requestId}`] ?? null);
    });
    return true;
  }
  return false;
});

function isAnalyzeRequest(m: unknown): m is AnalyzeRuntimeRequest {
  return typeof m === "object" && m !== null && (m as { type?: unknown }).type === "analyze-intercept";
}
function isResolveMessage(m: unknown): m is ResolveInterceptMessage {
  return typeof m === "object" && m !== null && (m as { type?: unknown }).type === "resolve-intercept";
}
function isGetPendingRequest(m: unknown): m is GetPendingRequestMessage {
  return typeof m === "object" && m !== null && (m as { type?: unknown }).type === "get-pending-request";
}

async function handleAnalyzeRequest(req: AnalyzeRuntimeRequest): Promise<AnalyzeRuntimeResponse> {
  // "enable" bir circuit çağrısı değil, sadece bağlantı izni istemidir; fon riski taşımaz.
  // Dedektör pipeline'ı (blindSignRisk vb.) contract-circuit çağrıları için anlamlıdır,
  // enable() üzerinde çalıştırmak kategori hatası olur (her zaman "unknown contract" görünür).
  if (req.method === "enable") {
    return { decision: "approve" };
  }

  const { result } = await analyze(req);

  if (!result.requiresManualApproval && result.findings.length === 0) {
    return { decision: "approve" };
  }

  const pending: PendingApproval = {
    requestId: req.requestId,
    method: req.method,
    originSite: req.originSite,
    args: req.args,
    findings: result.findings,
    highestSeverity: result.highestSeverity,
  };
  await chrome.storage.local.set({ [`baret:pending:${req.requestId}`]: pending });

  await chrome.windows.create({
    url: chrome.runtime.getURL(`approval/approval.html?requestId=${req.requestId}`),
    type: "popup",
    width: 420,
    height: 560,
  });

  return new Promise((resolve) => {
    pendingResolvers.set(req.requestId, resolve);
  });
}
