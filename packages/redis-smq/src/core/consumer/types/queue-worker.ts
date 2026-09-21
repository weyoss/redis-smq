import { IWorkerPayload } from '../../common/workers/types/worker.js';
import { IQueueParsedParams } from '../../../contracts/index.js';

export interface IQueueWorkerPayload extends IWorkerPayload {
  consumerId: string;
  queueParsedParams: IQueueParsedParams;
}
