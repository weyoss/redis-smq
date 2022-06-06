import { requiredConfig } from './config';
import { logger as factory } from 'redis-smq-common';

export const logger = factory.getLogger(requiredConfig.logger);
