/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  env,
  Heartbeat,
  IHeartbeatConfig,
  ILogger,
  IRedisClient,
} from 'redis-smq-common';
import * as os from 'node:os';
import { IHeartbeatPayload } from './types/index.js';

export function HeartbeatFactory(
  redisClient: IRedisClient,
  logger: ILogger,
  heartbeatConfig: IHeartbeatConfig,
  eventPublisher?: (heartbeat: Heartbeat<IHeartbeatPayload>) => void,
) {
  const cpuMonitor = env.CPUMonitor.getInstance();
  const heartbeat = new Heartbeat<IHeartbeatPayload>(
    redisClient,
    logger,
    heartbeatConfig,
    (cb) => {
      cb(null, {
        ram: {
          usage: process.memoryUsage(),
          free: os.freemem(),
          total: os.totalmem(),
        },
        cpu: cpuMonitor.getStats(
          `${heartbeatConfig.componentType}-${heartbeatConfig.componentId}`,
        ),
      });
    },
  );
  if (eventPublisher) eventPublisher(heartbeat);
  return heartbeat;
}
