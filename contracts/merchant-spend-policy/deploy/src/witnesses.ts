import { Ledger } from "./contract-index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

/**
 * Private state for the merchant-spend-policy contract: the deployer acts as both owner and
 * authorized signer for this initial testnet deployment. currentTime is supplied live (not
 * stored) since it must reflect wall-clock time at call time, not deployment time.
 */
export type PolicyPrivateState = {
  readonly ownerSk: Uint8Array;
  readonly signerSk: Uint8Array;
};

export const createPolicyPrivateState = (ownerSk: Uint8Array, signerSk: Uint8Array): PolicyPrivateState => ({
  ownerSk,
  signerSk,
});

export const witnesses = {
  ownerSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, PolicyPrivateState>): [PolicyPrivateState, Uint8Array] => [
    privateState,
    privateState.ownerSk,
  ],
  signerSecretKey: ({
    privateState,
  }: WitnessContext<Ledger, PolicyPrivateState>): [PolicyPrivateState, Uint8Array] => [
    privateState,
    privateState.signerSk,
  ],
  currentTime: ({
    privateState,
  }: WitnessContext<Ledger, PolicyPrivateState>): [PolicyPrivateState, bigint] => [
    privateState,
    BigInt(Math.floor(Date.now() / 1000)),
  ],
};
