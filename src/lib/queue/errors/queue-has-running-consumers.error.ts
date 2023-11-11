import { errors } from 'redis-smq-common';

export class QueueHasRunningConsumersError extends errors.RedisSMQError {
  constructor() {
    super(
      `Before deleting a queue/namespace, make sure it is not used by a message handler. After shutting down all message handlers, wait a few seconds and try again.`,
    );
  }
}