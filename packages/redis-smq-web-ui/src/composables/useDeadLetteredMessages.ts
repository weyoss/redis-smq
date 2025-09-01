/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref } from 'vue';
import { getApiV1NamespacesNsQueuesNameDeadLetteredMessages } from '@/api/generated/dead-lettered-messages/dead-lettered-messages';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.js';

/**
 * Composable for dead lettered messages with both delete and requeue capabilities
 * (dead lettered messages can be requeued to give them another chance)
 */
export function useDeadLetteredMessages(
  queueParams: Ref<IQueueParams>,
  initialPageSize = 20,
) {
  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiV1NamespacesNsQueuesNameDeadLetteredMessages(ns, name, {
        page,
        pageSize,
      });
    },
    queryKeyPrefix: 'dead-lettered-messages',
    enableDelete: true,
    enableRequeue: true, // Dead lettered messages can be requeued
  };

  return useMessages(queueParams, config, initialPageSize);
}
