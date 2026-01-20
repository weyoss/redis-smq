/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ILogger } from 'redis-smq-common';
import { WorkerAbstract } from '../../../common/worker/worker-abstract.js';
import { IQueueWorkerPayload } from '../../../common/worker/types/message-handler-worker.js';

export abstract class QueueWorkerAbstract extends WorkerAbstract {
  protected queueParsedParams;
  protected loggerContext;
  protected override logger: ILogger;

  constructor(payload: IQueueWorkerPayload) {
    super(payload.config);
    this.logger = createLogger(payload.config.logger, [
      ...payload.loggerContext.namespaces,
      this.constructor.name,
    ]);
    const { loggerContext, queueParsedParams } = payload;
    this.queueParsedParams = queueParsedParams;
    this.loggerContext = loggerContext;
    this.logger.info(`Initializing worker: ${this.constructor.name}`);
  }
}
