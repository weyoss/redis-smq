import { ConsumerError } from './consumer.error';
import { TQueueParams } from '../../../../../types';

export class MessageHandlerAlreadyExistsError extends ConsumerError {
  constructor(queue: TQueueParams, usingPriorityQueuing: boolean) {
    super(
      `A message handler for ${
        usingPriorityQueuing ? 'priority ' : ''
      }queue [${JSON.stringify(queue)}] already exists`,
    );
  }
}
