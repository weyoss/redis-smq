/*
 * packages/redis-smq/src/consumer/types/queue-workers.ts
 */

import { IQueueParsedParams } from '../../queue-manager/index.js';
import { IWorkerPayload } from '../../common/workers/types/worker.js';

export interface IQueueWorkerPayload extends IWorkerPayload {
  consumerId: string;
  queueParsedParams: IQueueParsedParams;
}
