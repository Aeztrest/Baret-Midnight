import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { Contract, Witnesses } from './contract-index.js';
import type { PolicyPrivateState } from './witnesses.js';

export const policyPrivateStateKey = 'merchantSpendPolicyPrivateState';
export type PrivateStateId = typeof policyPrivateStateKey;

export type PolicyContract = Contract<PolicyPrivateState, Witnesses<PolicyPrivateState>>;

export type PolicyCircuitKeys = Exclude<keyof PolicyContract['impureCircuits'], number | symbol>;

export type PolicyProviders = MidnightProviders<PolicyCircuitKeys, PrivateStateId, PolicyPrivateState>;

export type DeployedPolicyContract = FoundContract<PolicyContract>;
