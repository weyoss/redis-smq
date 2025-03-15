/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { it } from 'vitest';
import { ERedisConfigClient } from '../../src/redis-client/index.js';
import { redisConfig } from '../config.js';
import {
  pubSubChannel,
  pubSubPattern,
  scriptRunning,
  standardCommands,
  transactionRunning,
} from './common.js';

it('IORedisClient', async () => {
  const cfg = {
    ...redisConfig,
    ...{ client: ERedisConfigClient.IOREDIS },
  };
  await standardCommands(cfg);
  await scriptRunning(cfg);
  await pubSubChannel(cfg);
  await pubSubPattern(cfg);
  await transactionRunning(cfg);
});
