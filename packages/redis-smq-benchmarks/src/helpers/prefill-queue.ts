/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams, ProducibleMessage, RedisSMQ } from 'redis-smq';

export function prefillQueue(
  queue: IQueueParams,
  count: number,
  cb: ICallback,
) {
  const producer = RedisSMQ.startProducer((err) => {
    if (err) return cb(err);
    let sent = 0;
    const pump = () => {
      if (sent < count) {
        sent++;
        const msg = new ProducibleMessage().setQueue(queue).setBody(`m${sent}`);
        producer.produce(msg, (perr) => {
          if (perr) return cb(perr);
          pump();
        });
      } else cb();
    };
    pump();
  });
}
