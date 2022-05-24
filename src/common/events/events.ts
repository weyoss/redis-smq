import { events as baseEvents } from 'redis-smq-common';

export const events = {
  ...baseEvents,
  MESSAGE_PUBLISHED: 'message_produced',
  MESSAGE_NEXT: 'message_next',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_ACKNOWLEDGED: 'message_acknowledged',
  MESSAGE_UNACKNOWLEDGED: 'message_unacknowledged',
  MESSAGE_DEAD_LETTERED: 'message_dead_lettered',
};
