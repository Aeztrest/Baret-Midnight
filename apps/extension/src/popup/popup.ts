interface StoredPolicy {
  status: "ACTIVE" | "PAUSED" | "REVOKED";
  capPerTx: string;
  capPerDay: string;
  spentThisPeriod: string;
}

const SITE_POLICY_PREFIX = "baret:policy:";

async function currentSite(): Promise<string> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    return tab?.url ? new URL(tab.url).hostname : "";
  } catch {
    return "";
  }
}

async function loadPolicy(site: string): Promise<StoredPolicy | null> {
  const stored = await chrome.storage.local.get(SITE_POLICY_PREFIX + site);
  return (stored[SITE_POLICY_PREFIX + site] as StoredPolicy | undefined) ?? null;
}

async function savePolicy(site: string, policy: StoredPolicy) {
  await chrome.storage.local.set({ [SITE_POLICY_PREFIX + site]: policy });
}

async function init() {
  const site = await currentSite();
  document.getElementById("site")!.textContent = site || "(bilinmeyen site)";
  if (!site) return;

  const existing = await loadPolicy(site);
  const capPerTxInput = document.getElementById("capPerTx") as HTMLInputElement;
  const capPerDayInput = document.getElementById("capPerDay") as HTMLInputElement;
  const statusEl = document.getElementById("status")!;

  function renderStatus(policy: StoredPolicy | null) {
    statusEl.textContent = policy
      ? `Durum: ${policy.status} — bu dönem harcanan: ${policy.spentThisPeriod}`
      : "Bu site için henüz politika yok.";
  }

  if (existing) {
    capPerTxInput.value = existing.capPerTx;
    capPerDayInput.value = existing.capPerDay;
  }
  renderStatus(existing);

  document.getElementById("save")!.addEventListener("click", async () => {
    const policy: StoredPolicy = {
      status: existing?.status ?? "ACTIVE",
      capPerTx: capPerTxInput.value || "0",
      capPerDay: capPerDayInput.value || "0",
      spentThisPeriod: existing?.spentThisPeriod ?? "0",
    };
    await savePolicy(site, policy);
    renderStatus(policy);
  });

  document.getElementById("pause")!.addEventListener("click", async () => {
    const policy = (await loadPolicy(site)) ?? {
      status: "ACTIVE" as const,
      capPerTx: capPerTxInput.value || "0",
      capPerDay: capPerDayInput.value || "0",
      spentThisPeriod: "0",
    };
    policy.status = "PAUSED";
    await savePolicy(site, policy);
    renderStatus(policy);
  });

  document.getElementById("revoke")!.addEventListener("click", async () => {
    const policy = (await loadPolicy(site)) ?? {
      status: "ACTIVE" as const,
      capPerTx: capPerTxInput.value || "0",
      capPerDay: capPerDayInput.value || "0",
      spentThisPeriod: "0",
    };
    policy.status = "REVOKED";
    await savePolicy(site, policy);
    renderStatus(policy);
  });
}

init();
