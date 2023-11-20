/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

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
