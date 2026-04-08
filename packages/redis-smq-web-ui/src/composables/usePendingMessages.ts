/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref, computed } from 'vue';
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
  // Use a stable base prefix that doesn't change with consumer group
  const basePrefix = 'pending-messages';

  // Create a stable query key prefix that only changes when needed
  const queryKeyPrefix = computed(() => {
    // Use a consistent prefix pattern
    if (consumerGroupId.value) {
      return `${basePrefix}-cg-${consumerGroupId.value}`;
    }
    return basePrefix;
  });

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
        status: 'pending',
      });
    },
    queryKeyPrefix: queryKeyPrefix.value,
    enableDelete: true,
    enableRequeue: false,
  };

  return useMessages(queueParams, config, initialPageSize);
}
