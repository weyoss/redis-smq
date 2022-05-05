import { ConsumerError } from './consumer.error';
import { TQueueParams } from '../../../../../types';

export class MessageHandlerAlreadyExistsError extends ConsumerError {
  constructor(queue: TQueueParams) {
    super(
      `A message handler for queue [${queue.name}@${queue.ns}] already exists`,
    );
  }
}
