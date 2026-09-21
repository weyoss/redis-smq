/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { keys } from '../../redis/keys/keys.js';
import { withShared } from '../../redis/connection-pool/with-shared.js';
import { BackgroundJobWorkerNotFoundError } from '../../../errors/index.js';

export function _getWorker(jobId: string, cb: ICallback<string>) {
  const { keyJobWorker } = keys.getJobKeys(jobId);
  withShared((client, cb) => {
    client.get(keyJobWorker, (err, workerId) => {
      if (err) return cb(err);
      if (!workerId)
        return cb(
          new BackgroundJobWorkerNotFoundError({
            metadata: {
              jobId,
            },
          }),
        );
      cb(null, workerId);
    });
  }, cb);
}
