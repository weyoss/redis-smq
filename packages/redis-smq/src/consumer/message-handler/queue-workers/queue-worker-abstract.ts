/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ILogger } from 'redis-smq-common';
import { WorkerAbstract } from '../../../common/abstract/worker/worker-abstract.js';
import { IQueueWorkerPayload } from './types/queue-worker.js';

export abstract class QueueWorkerAbstract extends WorkerAbstract {
  protected queueParsedParams;
  protected loggerContext;
  protected consumerId;
  protected override logger: ILogger;

  constructor(payload: IQueueWorkerPayload) {
    super(payload.config);
    this.logger = createLogger(payload.config.logger, [
      ...payload.loggerContext.namespaces,
      this.constructor.name,
    ]);
    const { loggerContext, queueParsedParams, consumerId } = payload;
    this.queueParsedParams = queueParsedParams;
    this.loggerContext = loggerContext;
    this.consumerId = consumerId;
    this.logger.debug(`Queue worker ${this.constructor.name} initialized.`);
  }
}
