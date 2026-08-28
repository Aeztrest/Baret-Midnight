// MAIN world'de çalışır (sayfanın gerçek window nesnesine erişir). Amaç: Midnight cüzdanı
// (ör. Lace) window.midnight.lace'i her ne zaman atarsa atasın, dApp bu değere erişmeden
// ÖNCE onu bir Proxy ile sarmalamak. Sıralama garantisi olmadığı için (bizim content script'imiz
// cüzdanın kendi injection'ından önce ya da sonra çalışabilir) window.midnight'ın kendisine bir
// defineProperty tuzağı kuruyoruz — hangi sırada olursa olsun her atamayı yakalar.
// Bkz. Faz 0 spike kararı: docs/ altında ayrıca not düşülecek.

import { BARET_SOURCE, isPageMessage, type InterceptRequest, type InterceptResponse } from "./shared/messages.js";

type LaceLike = Record<string, unknown> & {
  enable?: (...args: unknown[]) => unknown;
  balanceTransaction?: (...args: unknown[]) => unknown;
  signData?: (...args: unknown[]) => unknown;
  submitTransaction?: (...args: unknown[]) => unknown;
};

const INTERCEPTED_METHODS = ["enable", "balanceTransaction", "signData", "submitTransaction"] as const;
type InterceptedMethod = (typeof INTERCEPTED_METHODS)[number];

const pending = new Map<string, { resolve: (v: InterceptResponse) => void }>();

window.addEventListener("message", (event: MessageEvent) => {
  if (event.source !== window) return;
  const data = event.data as unknown;
  if (!isPageMessage(data) || data.channel !== "intercept-response") return;
  const waiter = pending.get(data.requestId);
  if (!waiter) return;
  pending.delete(data.requestId);
  waiter.resolve(data);
});

function requestDecision(method: InterceptedMethod, args: unknown[]): Promise<InterceptResponse> {
  const requestId = crypto.randomUUID();
  const msg: InterceptRequest = {
    source: BARET_SOURCE,
    channel: "intercept-request",
    requestId,
    method,
    args,
    originSite: window.location.hostname,
  };
  return new Promise((resolve) => {
    pending.set(requestId, { resolve });
    window.postMessage(msg, "*");
  });
}

function wrapLace(target: LaceLike): LaceLike {
  return new Proxy(target, {
    get(obj, prop, receiver) {
      if (typeof prop === "string" && (INTERCEPTED_METHODS as readonly string[]).includes(prop)) {
        const original = obj[prop] as ((...a: unknown[]) => unknown) | undefined;
        if (typeof original !== "function") return original;
        return async (...args: unknown[]) => {
          const response = await requestDecision(prop as InterceptedMethod, args);
          if (response.decision === "reject") {
            throw new Error(`Baret: işlem reddedildi${response.reason ? ` (${response.reason})` : ""}`);
          }
          return original.apply(obj, args);
        };
      }
      return Reflect.get(obj, prop, receiver);
    },
  });
}

// `window.midnight` üzerinde, her `.lace` atamasını saran bir kap nesnesi kuruyoruz.
// Hem `window.midnight = { lace }` hem de `window.midnight.lace = api` paternlerini yakalar.
function installMidnightTrap() {
  let container: Record<string, unknown> = {};
  let realLace: LaceLike | undefined;

  const proxyContainer = new Proxy(container, {
    get(obj, prop, receiver) {
      if (prop === "lace" && realLace) return wrapLace(realLace);
      return Reflect.get(obj, prop, receiver);
    },
    set(obj, prop, value, receiver) {
      if (prop === "lace") {
        realLace = value as LaceLike;
        return true;
      }
      return Reflect.set(obj, prop, value, receiver);
    },
  });

  Object.defineProperty(window, "midnight", {
    configurable: true,
    get() {
      return proxyContainer;
    },
    set(value: Record<string, unknown>) {
      if (value && typeof value === "object" && "lace" in value) {
        realLace = value.lace as LaceLike;
      }
      container = { ...container, ...value };
    },
  });
}

installMidnightTrap();
