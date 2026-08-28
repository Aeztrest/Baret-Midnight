import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum PolicyStatus { ACTIVE = 0, PAUSED = 1, REVOKED = 2 }

export type Witnesses<PS> = {
  ownerSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  signerSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  currentTime(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
}

export type ImpureCircuits<PS> = {
  setPolicy(context: __compactRuntime.CircuitContext<PS>,
            newCapPerTx_0: bigint,
            newCapPerDay_0: bigint,
            newMandateSeconds_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  pause(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  resume(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  revoke(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  authorizeSpend(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  setPolicy(context: __compactRuntime.CircuitContext<PS>,
            newCapPerTx_0: bigint,
            newCapPerDay_0: bigint,
            newMandateSeconds_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  pause(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  resume(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  revoke(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  authorizeSpend(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  ownerCommitmentOf(sk_0: Uint8Array): Uint8Array;
  signerCommitmentOf(sk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  ownerCommitmentOf(context: __compactRuntime.CircuitContext<PS>,
                    sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  signerCommitmentOf(context: __compactRuntime.CircuitContext<PS>,
                     sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  setPolicy(context: __compactRuntime.CircuitContext<PS>,
            newCapPerTx_0: bigint,
            newCapPerDay_0: bigint,
            newMandateSeconds_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  pause(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  resume(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  revoke(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  authorizeSpend(context: __compactRuntime.CircuitContext<PS>, amount_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  readonly status: PolicyStatus;
  readonly ownerCommitment: Uint8Array;
  readonly signerCommitment: Uint8Array;
  readonly merchant: Uint8Array;
  readonly capPerTx: bigint;
  readonly capPerDay: bigint;
  readonly mandateSeconds: bigint;
  readonly periodStart: bigint;
  readonly spentThisPeriod: bigint;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               ownerCommitment__0: Uint8Array,
               signerCommitment__0: Uint8Array,
               merchant__0: Uint8Array,
               capPerTx__0: bigint,
               capPerDay__0: bigint,
               mandateSeconds__0: bigint,
               startTime__0: bigint): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
