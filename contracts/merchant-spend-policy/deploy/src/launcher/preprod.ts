import { createLogger } from '../logger-utils.js';
import { deployHeadless } from '../deploy-headless.js';
import { PreprodRemoteConfig } from '../config.js';
import { inspect } from 'node:util';

try {
  const config = new PreprodRemoteConfig();
  const logger = await createLogger(config.logDir);
  const testEnvironment = config.getEnvironment(logger);
  await deployHeadless(config, testEnvironment, logger);
} catch (e) {
  console.error('FATAL:', inspect(e, { depth: 10, showHidden: true }));
  process.exit(1);
}
