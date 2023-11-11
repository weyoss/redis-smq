import { logger as factory } from 'redis-smq-common';
import { Configuration } from '../../src/config/configuration';

export const logger = factory.getLogger(Configuration.getSetConfig().logger);
