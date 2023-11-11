import { ConsumerError } from './consumer.error';
import { IQueueParams } from '../../../../types';

export class MessageHandlerAlreadyExistsError extends ConsumerError {
  constructor(queue: IQueueParams) {
    super(
      `A message handler for queue [${queue.name}@${queue.ns}] already exists`,
    );
  }
}
