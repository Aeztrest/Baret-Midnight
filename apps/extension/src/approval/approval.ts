import type { GetPendingRequestMessage, PendingApproval, ResolveInterceptMessage } from "../shared/messages.js";

const params = new URLSearchParams(window.location.search);
const requestId = params.get("requestId") ?? "";

async function load() {
  const req: GetPendingRequestMessage = { type: "get-pending-request", requestId };
  const pending = (await chrome.runtime.sendMessage(req)) as PendingApproval | null;
  if (!pending) {
    document.getElementById("method")!.textContent = "Request not found";
    return;
  }

  document.getElementById("method")!.textContent = `${pending.method}()`;
  document.getElementById("site")!.textContent = pending.originSite;

  const container = document.getElementById("findings")!;
  if (pending.findings.length === 0) {
    container.innerHTML = '<div id="empty">No known risk found, but this transaction is unrecognized so it needs your approval.</div>';
  } else {
    for (const f of pending.findings) {
      const div = document.createElement("div");
      div.className = `finding ${f.severity}`;
      div.innerHTML = `<div class="title">${f.title}</div><div>${f.detail}</div>`;
      container.appendChild(div);
    }
  }
}

function respond(decision: "approve" | "reject") {
  const msg: ResolveInterceptMessage = { type: "resolve-intercept", requestId, decision };
  chrome.runtime.sendMessage(msg).then(() => window.close());
}

document.getElementById("approve")!.addEventListener("click", () => respond("approve"));
document.getElementById("reject")!.addEventListener("click", () => respond("reject"));

load();
