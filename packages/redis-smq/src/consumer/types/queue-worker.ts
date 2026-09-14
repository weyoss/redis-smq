/*
 * packages/redis-smq/src/consumer/types/queue-worker.ts
 */

import { IQueueParsedParams } from '../../queue-manager/index.js';
import { IWorkerPayload } from '../../common/abstract/worker/types/worker.js';

export interface IQueueWorkerPayload extends IWorkerPayload {
  consumerId: string;
  queueParsedParams: IQueueParsedParams;
}
