/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, type Ref } from 'vue';
import { getApiV1NamespacesNsQueuesNamePendingMessages } from '@/api/generated/pending-messages/pending-messages';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.js';
import type { GetApiV1NamespacesNsQueuesNamePendingMessagesParams } from '@/api/model/getApiV1NamespacesNsQueuesNamePendingMessagesParams.js';

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
  // Create extra parameters from the consumer group ID
  const extraParams = computed(() => {
    const params: Record<string, unknown> = {};
    if (consumerGroupId.value) {
      params.consumerGroupId = consumerGroupId.value;
    }
    return params;
  });

  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize, extraParams = {} }) => {
      const apiParams: GetApiV1NamespacesNsQueuesNamePendingMessagesParams = {
        page,
        pageSize,
      };

      // Add consumer group ID if present in extra parameters
      if (extraParams.consumerGroupId) {
        apiParams.consumerGroupId = String(extraParams.consumerGroupId);
      }

      return getApiV1NamespacesNsQueuesNamePendingMessages(ns, name, apiParams);
    },
    queryKeyPrefix: 'pending-messages',
    enableDelete: true,
    enableRequeue: false, // Pending messages can not be requeued
  };

  return useMessages(queueParams, config, initialPageSize, extraParams);
}
