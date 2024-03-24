/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../../../common/redis-keys/redis-keys.js';

export function _cleanupOfflineConsumer(
  redisClient: IRedisClient,
  consumerIds: string[],
  cb: ICallback<void>,
) {
  const { keyHeartbeats, keyHeartbeatTimestamps } = redisKeys.getMainKeys();
  const keys = [keyHeartbeats, keyHeartbeatTimestamps];
  const args: string[] = [];
  async.eachOf(
    consumerIds,
    (id, _, done) => {
      const { keyConsumerQueues } = redisKeys.getConsumerKeys(id);
      keys.push(keyConsumerQueues);
      args.push(id);
      done();
    },
    () => {
      redisClient.runScript(
        ELuaScriptName.CLEANUP_OFFLINE_CONSUMER,
        keys,
        args,
        (err) => cb(err),
      );
    },
  );
}
