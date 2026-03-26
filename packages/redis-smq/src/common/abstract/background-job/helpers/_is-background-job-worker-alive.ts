/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { withSharedPoolConnection } from '../../../redis/redis-connection-pool/with-shared-pool-connection.js';
import { redisKeys } from '../../../redis/redis-keys/redis-keys.js';
import { async, Heartbeat, ICallback } from 'redis-smq-common';
import { _getBackgroundJobWorker } from './_get-background-job-worker.js';

export function _isBackgroundJobWorkerAlive(
  jobId: string,
  cb: ICallback<boolean>,
) {
  withSharedPoolConnection((client, cb) => {
    async.waterfall(
      [
        (cb: ICallback<string>) => _getBackgroundJobWorker(jobId, cb),
        (workerId, cb) => {
          const { keyWorkerHeartbeat } = redisKeys.getWorkerKeys(workerId);
          Heartbeat.isComponentAlive(client, keyWorkerHeartbeat, cb);
        },
      ],
      cb,
    );
  }, cb);
}
