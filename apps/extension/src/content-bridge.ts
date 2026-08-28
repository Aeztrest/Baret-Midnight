// ISOLATED world içerik betiği. inject.ts (MAIN world) ile postMessage üzerinden,
// background service worker ile chrome.runtime.sendMessage üzerinden konuşur.
// MAIN world'ün chrome.* API'lerine erişimi olmadığı için bu köprü gerekiyor.

import {
  BARET_SOURCE,
  isPageMessage,
  type AnalyzeRuntimeRequest,
  type AnalyzeRuntimeResponse,
  type InterceptResponse,
} from "./shared/messages.js";

window.addEventListener("message", async (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data as unknown;
  if (!isPageMessage(data) || data.channel !== "intercept-request") return;

  const runtimeRequest: AnalyzeRuntimeRequest = {
    type: "analyze-intercept",
    requestId: data.requestId,
    method: data.method,
    args: data.args,
    originSite: data.originSite,
  };

  const runtimeResponse = (await chrome.runtime.sendMessage(runtimeRequest)) as AnalyzeRuntimeResponse;

  const response: InterceptResponse = {
    source: BARET_SOURCE,
    channel: "intercept-response",
    requestId: data.requestId,
    decision: runtimeResponse.decision,
    reason: runtimeResponse.reason,
  };
  window.postMessage(response, "*");
});
