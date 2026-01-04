/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { WorkerAbstract } from './worker-abstract.js';
import { async, ICallback } from 'redis-smq-common';
import {
  TConsumerMessageHandlerWorkerBootstrapFn,
  TConsumerMessageHandlerWorkerPayload,
} from './types/index.js';
import { RedisSMQ } from '../../../redis-smq.js';

export function workerBootstrap(
  WorkerCtor: new (
    ...args: ConstructorParameters<typeof WorkerAbstract>
  ) => WorkerAbstract,
): TConsumerMessageHandlerWorkerBootstrapFn {
  return (payload: TConsumerMessageHandlerWorkerPayload) => {
    const { queueParsedParams, redisConfig, loggerContext } = payload;
    let worker: WorkerAbstract | null = null;
    return {
      run(cb: ICallback) {
        if (!worker) {
          return RedisSMQ.initialize(redisConfig, (err) => {
            if (err) return cb(err);
            worker = new WorkerCtor(queueParsedParams, loggerContext);
            worker.run((err) => cb(err));
          });
        }
        cb();
      },
      shutdown(cb: ICallback) {
        if (worker)
          async.series(
            [
              (cb) => worker?.shutdown(cb) || cb(),
              (cb) => RedisSMQ.shutdown(cb),
            ],
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
