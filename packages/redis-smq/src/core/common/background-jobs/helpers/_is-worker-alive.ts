/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { withShared } from '../../redis/connection-pool/with-shared.js';
import { keys } from '../../redis/keys/keys.js';
import { async, Heartbeat, ICallback } from 'redis-smq-common';
import { _getWorker } from './_get-worker.js';

export function _isWorkerAlive(jobId: string, cb: ICallback<boolean>) {
  withShared((client, cb) => {
    async.waterfall(
      [
        (cb: ICallback<string>) => _getWorker(jobId, cb),
        (workerId, cb) => {
          const { keyWorkerHeartbeat } = keys.getWorkerKeys(workerId);
          Heartbeat.isComponentAlive(client, keyWorkerHeartbeat, cb);
        },
      ],
      cb,
    );
  }, cb);
}
