import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";
// Derlenmiş çıktı (--skip-zk). Gerçek ZK kanıtı üretmez, sadece state-transition mantığını
// çalıştırır — bkz. docs/01-feature-spec.md §5 ve Faz 0 donanım bulgusu.
// apps/server bunu, gerçek testnet'e bağlanana kadar bir "gölge defter" (shadow ledger) olarak
// kullanır: politika mantığı gerçek derlenmiş Compact koduyla uygulanır, sadece zincire submit
// edilmez.
import { Contract, ledger, pureCircuits } from "../managed/merchant-spend-policy/contract/index.js";

const COIN_PUBLIC_KEY = "aa".repeat(32);

export type CircuitName = "authorizeSpend" | "setPolicy" | "pause" | "resume" | "revoke";

export interface PolicyLedgerView {
  status: number;
  ownerCommitment: Uint8Array;
  signerCommitment: Uint8Array;
  merchant: Uint8Array;
  capPerTx: bigint;
  capPerDay: bigint;
  mandateSeconds: bigint;
  periodStart: bigint;
  spentThisPeriod: bigint;
}

export interface ActingKeys {
  ownerSk?: Uint8Array;
  signerSk?: Uint8Array;
}

type PS = null;

export function commitmentFor(role: "owner" | "signer", sk: Uint8Array): Uint8Array {
  return role === "owner" ? pureCircuits.ownerCommitmentOf(sk) : pureCircuits.signerCommitmentOf(sk);
}

/**
 * Tek bir merchant-spend-policy sözleşme örneğini, proof üretmeden çalıştıran simülatör.
 * Deploy sırasında commitment'i belirleyen "gerçek" owner/signer anahtarları ile, her çağrıda
 * witness olarak sunulan "eyleyen" anahtarlar kasıtlı olarak ayrıştırılmıştır — böylece
 * yetkisiz bir anahtarla çağrı denemesi (impersonation) gerçekçi şekilde simüle edilebilir.
 */
export class PolicySimulator {
  private readonly contract;
  private readonly contractAddress = sampleContractAddress();
  private clock: bigint;
  private state?: { contractState: unknown; privateState: PS };
  private actingOwnerSk!: Uint8Array;
  private actingSignerSk!: Uint8Array;

  constructor(startTime: bigint) {
    this.clock = startTime;
    this.contract = new Contract({
      ownerSecretKey: (ctx: { privateState: PS }) => [ctx.privateState, this.actingOwnerSk],
      signerSecretKey: (ctx: { privateState: PS }) => [ctx.privateState, this.actingSignerSk],
      currentTime: (ctx: { privateState: PS }) => [ctx.privateState, this.clock],
    });
  }

  setClock(t: bigint) {
    this.clock = t;
  }

  advanceClock(deltaSeconds: bigint) {
    this.clock += deltaSeconds;
  }

  async deploy(
    merchant: Uint8Array,
    capPerTx: bigint,
    capPerDay: bigint,
    mandateSeconds: bigint,
    ownerSk: Uint8Array,
    signerSk: Uint8Array
  ): Promise<PolicyLedgerView> {
    this.actingOwnerSk = ownerSk;
    this.actingSignerSk = signerSk;
    const ctorCtx = createConstructorContext(null as PS, COIN_PUBLIC_KEY);
    const result = await this.contract.initialState(
      ctorCtx,
      commitmentFor("owner", ownerSk),
      commitmentFor("signer", signerSk),
      merchant,
      capPerTx,
      capPerDay,
      mandateSeconds,
      this.clock
    );
    this.state = { contractState: result.currentContractState, privateState: result.currentPrivateState };
    return this.ledger();
  }

  /** `actingKeys` verilirse SADECE bu çağrı için farklı bir (ör. yetkisiz) anahtar sunulur. */
  async call(circuitName: CircuitName, args: unknown[] = [], actingKeys?: ActingKeys): Promise<PolicyLedgerView> {
    if (!this.state) throw new Error("deploy() önce çağrılmalı");
    const savedOwner = this.actingOwnerSk;
    const savedSigner = this.actingSignerSk;
    if (actingKeys?.ownerSk) this.actingOwnerSk = actingKeys.ownerSk;
    if (actingKeys?.signerSk) this.actingSignerSk = actingKeys.signerSk;

    try {
      const ctx = createCircuitContext(
        circuitName,
        this.contractAddress,
        COIN_PUBLIC_KEY,
        this.state.contractState as never,
        this.state.privateState
      );
      const circuits = this.contract.circuits as Record<
        string,
        (ctx: unknown, ...a: unknown[]) => Promise<{ context: { callContext: { currentQueryContext: { state: unknown }; currentPrivateState: PS } } }>
      >;
      const result = await circuits[circuitName](ctx, ...args);
      this.state = {
        contractState: result.context.callContext.currentQueryContext.state,
        privateState: result.context.callContext.currentPrivateState,
      };
      return this.ledger();
    } finally {
      this.actingOwnerSk = savedOwner;
      this.actingSignerSk = savedSigner;
    }
  }

  ledger(): PolicyLedgerView {
    if (!this.state) throw new Error("deploy() önce çağrılmalı");
    const raw = this.state.contractState as { data?: unknown };
    const chargedState = typeof raw?.data !== "undefined" ? raw.data : raw;
    return ledger(chargedState as never) as unknown as PolicyLedgerView;
  }
}
