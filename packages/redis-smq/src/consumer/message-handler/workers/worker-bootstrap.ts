/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../../../config/index.js';
import { WorkerAbstract } from './worker-abstract.js';
import { async, ICallback } from 'redis-smq-common';
import { IQueueParsedParams } from '../../../queue-manager/index.js';
import {
  TConsumerMessageHandlerWorkerBootstrapFn,
  TConsumerMessageHandlerWorkerPayload,
} from './types/index.js';

export function workerBootstrap(
  WorkerCtor: new (queueParsedParams: IQueueParsedParams) => WorkerAbstract,
): TConsumerMessageHandlerWorkerBootstrapFn {
  return (payload: TConsumerMessageHandlerWorkerPayload) => {
    const { queueParsedParams, redisConfig } = payload;
    let worker: WorkerAbstract | null = null;
    return {
      run(cb: ICallback) {
        if (!worker) {
          return Configuration.initialize(redisConfig, (err) => {
            if (err) return cb(err);
            worker = new WorkerCtor(queueParsedParams);
            worker.run((err) => cb(err));
          });
        }
        cb();
      },
      shutdown(cb: ICallback) {
        if (worker)
          async.series(
            [(cb) => worker?.shutdown(cb), (cb) => Configuration.shutdown(cb)],
            () => {
              worker = null;
              cb();
            },
          );
        cb();
      },
    };
  };
}
