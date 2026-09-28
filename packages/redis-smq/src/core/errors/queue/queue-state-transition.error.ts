/*
 * packages/redis-smq/src/core/errors/queue/queue-state-transition.error.ts
 */

import { RedisSMQError } from 'redis-smq-common';
import { EQueueOperationalState } from '../../../contracts/index.js';

export class QueueStateTransitionError extends RedisSMQError<{
  from: EQueueOperationalState;
  to: EQueueOperationalState;
}> {
  static override readonly code = 'RedisSMQ.Queue.StateTransitionFailed';
  static override readonly defaultMessage =
    'An invalid queue state transition is attempted.';
}
