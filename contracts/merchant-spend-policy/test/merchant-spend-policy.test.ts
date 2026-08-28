import { describe, expect, it } from "vitest";
import { PolicySimulator } from "../src/simulator.js";

const OWNER_SK = new Uint8Array(32).fill(1);
const SIGNER_SK = new Uint8Array(32).fill(2);
const MERCHANT = new Uint8Array(32).fill(9);
const WRONG_SK = new Uint8Array(32).fill(66);

async function deployDefault(capPerTx = 100n, capPerDay = 500n, mandateSeconds = 3600n) {
  const p = new PolicySimulator(1000n);
  await p.deploy(MERCHANT, capPerTx, capPerDay, mandateSeconds, OWNER_SK, SIGNER_SK);
  return p;
}

describe("deploy / initial state", () => {
  it("ACTIVE durumda ve doğru başlangıç değerleriyle deploy edilir", async () => {
    const p = new PolicySimulator(1000n);
    const l = await p.deploy(MERCHANT, 100n, 500n, 3600n, OWNER_SK, SIGNER_SK);
    expect(l.status).toBe(0); // ACTIVE
    expect(l.capPerTx).toBe(100n);
    expect(l.capPerDay).toBe(500n);
    expect(l.spentThisPeriod).toBe(0n);
  });
});

describe("authorizeSpend", () => {
  it("limit içindeki harcamayı kabul eder ve dönem toplamını günceller", async () => {
    const p = await deployDefault();
    const l1 = await p.call("authorizeSpend", [10n]);
    expect(l1.spentThisPeriod).toBe(10n);
    const l2 = await p.call("authorizeSpend", [15n]);
    expect(l2.spentThisPeriod).toBe(25n);
  });

  it("işlem başı limiti aşan harcamayı reddeder", async () => {
    const p = await deployDefault();
    await expect(p.call("authorizeSpend", [101n])).rejects.toThrow(/per-transaction cap/);
  });

  it("günlük limiti aşan (birikimli) harcamayı reddeder", async () => {
    const p = await deployDefault(100n, 150n);
    await p.call("authorizeSpend", [100n]);
    await expect(p.call("authorizeSpend", [60n])).rejects.toThrow(/per-day cap/);
  });

  it("24 saat sonra dönemi sıfırlar ve önceden reddedilen tutara izin verir", async () => {
    const p = await deployDefault(100n, 150n);
    await p.call("authorizeSpend", [100n]);
    await expect(p.call("authorizeSpend", [60n])).rejects.toThrow(/per-day cap/);

    p.advanceClock(86400n);
    const l = await p.call("authorizeSpend", [60n]);
    expect(l.spentThisPeriod).toBe(60n); // dönem sıfırlandı, 100 değil 60'tan başladı
  });

  it("yetkisiz bir signer anahtarıyla harcamayı reddeder", async () => {
    const p = await deployDefault();
    await expect(p.call("authorizeSpend", [10n], { signerSk: WRONG_SK })).rejects.toThrow(/Not an authorized signer/);
  });

  it("PAUSED durumdayken harcamayı reddeder", async () => {
    const p = await deployDefault();
    await p.call("pause");
    await expect(p.call("authorizeSpend", [10n])).rejects.toThrow(/not active/);
  });
});

describe("owner-only işlemler", () => {
  it("yanlış owner anahtarıyla setPolicy/pause/revoke reddedilir", async () => {
    const p = await deployDefault();
    await expect(p.call("pause", [], { ownerSk: WRONG_SK })).rejects.toThrow(/Not the policy owner/);
    await expect(p.call("revoke", [], { ownerSk: WRONG_SK })).rejects.toThrow(/Not the policy owner/);
    await expect(p.call("setPolicy", [1n, 1n, 1n], { ownerSk: WRONG_SK })).rejects.toThrow(/Not the policy owner/);
  });

  it("setPolicy limitleri günceller", async () => {
    const p = await deployDefault();
    const l = await p.call("setPolicy", [200n, 1000n, 7200n]);
    expect(l.capPerTx).toBe(200n);
    expect(l.capPerDay).toBe(1000n);
    expect(l.mandateSeconds).toBe(7200n);
  });

  it("pause → resume durum döngüsü doğru çalışır", async () => {
    const p = await deployDefault();
    expect((await p.call("pause")).status).toBe(1); // PAUSED
    expect((await p.call("resume")).status).toBe(0); // ACTIVE
    expect((await p.call("pause")).status).toBe(1); // tekrar PAUSED
  });

  it("revoke sonrası politika kalıcı olarak kapanır", async () => {
    const p = await deployDefault();
    const l = await p.call("revoke");
    expect(l.status).toBe(2); // REVOKED
    await expect(p.call("authorizeSpend", [1n])).rejects.toThrow(/not active/);
    await expect(p.call("setPolicy", [1n, 1n, 1n])).rejects.toThrow(/revoked/);
  });
});
