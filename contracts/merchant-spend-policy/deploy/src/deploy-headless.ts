import { WebSocket } from 'ws';
import { randomBytes } from 'node:crypto';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { type TestEnvironment } from '@midnight-ntwrk/testkit-js';
import { type Logger } from 'pino';

import { type Config } from './config.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { waitForUnshieldedFunds, syncWallet } from './wallet-utils.js';
import { generateDust } from './generate-dust.js';
import { deployMerchantSpendPolicy } from './api.js';
import { commitmentFor } from './contract-index.js';
import { type PrivateStateId, type PolicyProviders } from './common-types.js';
import { type PolicyPrivateState } from './witnesses.js';

// @ts-expect-error: needed for Apollo's WebSocket usage under Node
globalThis.WebSocket = WebSocket;

/**
 * Non-interactive variant of the official example CLI's `run()`: always builds a fresh wallet,
 * requests testnet funds from the faucet automatically, generates dust, and deploys a single
 * merchant-spend-policy contract with fixed demo parameters. Intended to run once in CI
 * (see .github/workflows/deploy-testnet.yml) on an ADX-capable runner.
 */
export const deployHeadless = async (config: Config, testEnv: TestEnvironment, logger: Logger): Promise<void> => {
  const envConfiguration = await testEnv.start();
  logger.info(`Environment started: ${JSON.stringify(envConfiguration)}`);

  const seed = toHex(randomBytes(32));
  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);

  try {
    await walletProvider.start();

    const unshieldedState = await waitForUnshieldedFunds(
      logger,
      walletProvider.wallet,
      envConfiguration,
      unshieldedToken(),
      /* fundFromFaucet */ true,
    );
    const nightBalance = unshieldedState.balances[unshieldedToken().raw];
    logger.info(`NIGHT balance after funding: ${nightBalance}`);
    if (!nightBalance) {
      throw new Error('Faucet funding did not arrive; aborting deploy.');
    }

    if (config.generateDust) {
      const dustTx = await generateDust(logger, seed, unshieldedState, walletProvider.wallet);
      if (dustTx) {
        logger.info(`Dust generation tx: ${dustTx}`);
        await syncWallet(logger, walletProvider.wallet);
      }
    }

    const zkConfigProvider = new NodeZkConfigProvider<'setPolicy' | 'authorizeSpend' | 'pause' | 'resume' | 'revoke'>(
      config.zkConfigPath,
    );
    const providers: PolicyProviders = {
      privateStateProvider: levelPrivateStateProvider<PrivateStateId, PolicyPrivateState>({
        privateStateStoreName: config.privateStateStoreName,
        signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
        privateStoragePasswordProvider: () => 'Baret-Midnight-Deploy-2026!',
        accountId: seed,
      }),
      publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
      zkConfigProvider,
      proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
      walletProvider,
      midnightProvider: walletProvider,
    };

    const ownerSk = randomBytes(32);
    const signerSk = randomBytes(32);
    const merchant = randomBytes(32);
    const now = BigInt(Math.floor(Date.now() / 1000));

    const deployed = await deployMerchantSpendPolicy(
      providers,
      {
        ownerSk,
        signerSk,
        ownerCommitment: commitmentFor('owner', ownerSk),
        signerCommitment: commitmentFor('signer', signerSk),
        merchant,
        capPerTx: 100n,
        capPerDay: 500n,
        mandateSeconds: 3600n,
        startTime: now,
      },
      logger,
    );

    const address = deployed.deployTxData.public.contractAddress;
    logger.info('=== DEPLOY SUCCESSFUL ===');
    logger.info(`Contract address: ${address}`);
    logger.info(`Deploy tx hash: ${deployed.deployTxData.public.txHash}`);
    console.log(`BARET_DEPLOYED_CONTRACT_ADDRESS=${address}`);
  } finally {
    await walletProvider.stop();
    await testEnv.shutdown();
  }
};
