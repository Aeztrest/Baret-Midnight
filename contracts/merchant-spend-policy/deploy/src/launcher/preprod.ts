import { createLogger } from '../logger-utils.js';
import { deployHeadless } from '../deploy-headless.js';
import { PreprodRemoteConfig } from '../config.js';

const config = new PreprodRemoteConfig();
const logger = await createLogger(config.logDir);
const testEnvironment = config.getEnvironment(logger);
await deployHeadless(config, testEnvironment, logger);
