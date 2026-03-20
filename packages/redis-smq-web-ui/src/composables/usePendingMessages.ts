/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref } from 'vue';
import { getApiNamespacesNsQueuesNameMessages } from '@/api/generated/queue-messages/queue-messages.ts';
import { getApiNamespacesNsQueuesNameConsumerGroupsConsumerGroupIdMessages } from '@/api/generated/consumer-groups/consumer-groups.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';

/**
 * Composable for pending messages with both delete and requeue capabilities
 * (pending messages are waiting to be processed and can be managed)
 * Supports consumer group filtering for pub/sub queues
 */
export function usePendingMessages(
  queueParams: Ref<IQueueParams | null>,
  consumerGroupId: Ref<string | null>,
  initialPageSize = 20,
) {
  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      // Add consumer group ID if present in extra parameters
      if (consumerGroupId.value) {
        return getApiNamespacesNsQueuesNameConsumerGroupsConsumerGroupIdMessages(
          ns,
          name,
          consumerGroupId.value,
          {
            page,
            pageSize,
          },
        );
      }

      return getApiNamespacesNsQueuesNameMessages(ns, name, {
        page,
        pageSize,
      });
    },
    queryKeyPrefix: `${consumerGroupId.value ? `consumer-group-${consumerGroupId.value}-` : ''}pending-messages`,
    enableDelete: true,
    enableRequeue: false, // Pending messages can not be requeued
  };

  return useMessages(queueParams, config, initialPageSize);
}
