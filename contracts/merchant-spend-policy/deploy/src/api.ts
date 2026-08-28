import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledMerchantSpendPolicyContract, ledger } from './contract-index.js';
import { createPolicyPrivateState } from './witnesses.js';
import { policyPrivateStateKey, type DeployedPolicyContract, type PolicyProviders } from './common-types.js';

export interface DeployParams {
  ownerSk: Uint8Array;
  signerSk: Uint8Array;
  ownerCommitment: Uint8Array;
  signerCommitment: Uint8Array;
  merchant: Uint8Array;
  capPerTx: bigint;
  capPerDay: bigint;
  mandateSeconds: bigint;
  startTime: bigint;
}

export async function deployMerchantSpendPolicy(
  providers: PolicyProviders,
  params: DeployParams,
  logger?: Logger,
): Promise<DeployedPolicyContract> {
  logger?.info('Deploying merchant-spend-policy contract...');

  const deployed = await deployContract(providers, {
    compiledContract: CompiledMerchantSpendPolicyContract,
    privateStateId: policyPrivateStateKey,
    initialPrivateState: createPolicyPrivateState(params.ownerSk, params.signerSk),
    args: [
      params.ownerCommitment,
      params.signerCommitment,
      params.merchant,
      params.capPerTx,
      params.capPerDay,
      params.mandateSeconds,
      params.startTime,
    ],
  });

  logger?.info(`Deployed at address: ${deployed.deployTxData.public.contractAddress}`);
  return deployed;
}

export { ledger };
