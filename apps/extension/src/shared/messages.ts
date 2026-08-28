// inject.ts (MAIN world) <-> content-bridge.ts (ISOLATED world) <-> background.ts arasındaki
// mesaj sözleşmesi. Bkz. docs/01-feature-spec.md ve Faz 0 spike notu:
// dApp Connector API (window.midnight.lace) çağrılarını gerçek cüzdana ulaşmadan önce
// yakalamak için Proxy tabanlı bir wrap paterni kullanılıyor.

export const BARET_SOURCE = "baret-midnight" as const;

/** MAIN dünyasından (inject.ts) ISOLATED dünyaya (content-bridge.ts) giden istek. */
export interface InterceptRequest {
  source: typeof BARET_SOURCE;
  channel: "intercept-request";
  requestId: string;
  method: "enable" | "balanceTransaction" | "signData" | "submitTransaction";
  args: unknown[];
  originSite: string;
}

/** ISOLATED dünyadan MAIN dünyaya dönen karar. */
export interface InterceptResponse {
  source: typeof BARET_SOURCE;
  channel: "intercept-response";
  requestId: string;
  decision: "approve" | "reject";
  reason?: string;
}

export type PageMessage = InterceptRequest | InterceptResponse;

export function isPageMessage(data: unknown): data is PageMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as { source?: unknown }).source === BARET_SOURCE
  );
}

/** content-bridge.ts <-> background.ts arasındaki runtime mesajları. */
export interface AnalyzeRuntimeRequest {
  type: "analyze-intercept";
  requestId: string;
  method: InterceptRequest["method"];
  args: unknown[];
  originSite: string;
}

export interface AnalyzeRuntimeResponse {
  decision: "approve" | "reject";
  reason?: string;
}

/** approval.ts -> background.ts: kullanıcının onay penceresinde verdiği karar. */
export interface ResolveInterceptMessage {
  type: "resolve-intercept";
  requestId: string;
  decision: "approve" | "reject";
  reason?: string;
}

export interface GetPendingRequestMessage {
  type: "get-pending-request";
  requestId: string;
}

/** background.ts'in chrome.storage.local'a yazdığı, approval.html'in okuduğu kayıt. */
export interface PendingApproval {
  requestId: string;
  method: AnalyzeRuntimeRequest["method"];
  originSite: string;
  args: unknown[];
  findings: { id: string; severity: "info" | "warning" | "critical"; title: string; detail: string }[];
  highestSeverity: "info" | "warning" | "critical" | "none";
}
