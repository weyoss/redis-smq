/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, it } from 'vitest';
import { ERedisConfigClient } from '../../../src/redis-client/index.js';
import {
  driverConfig,
  pubSubChannel,
  pubSubPattern,
  scriptRunning,
  standardCommands,
  transactionRunning,
} from './common.js';

// Lazy — same reason as in `node-redis.test.ts`.
const config = () => driverConfig(ERedisConfigClient.IOREDIS);

describe('ioredis client', () => {
  it('runs the standard command surface', () => standardCommands(config()));
  it('loads and runs Lua scripts', () => scriptRunning(config()));
  it('delivers pub/sub messages on channels', () => pubSubChannel(config()));
  it('delivers pub/sub messages on patterns', () => pubSubPattern(config()));
  it('runs multi-command transactions', () => transactionRunning(config()));
});
