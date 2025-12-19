/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref } from 'vue';
import { getApiV1NamespacesNsQueuesNameScheduledMessages } from '@/api/generated/scheduled-messages/scheduled-messages.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';

/**
 * Composable for scheduled messages with delete capability but no requeue
 * (scheduled messages are already queued for future execution)
 */
export function useScheduledMessages(
  queueParams: Ref<IQueueParams>,
  initialPageSize = 20,
) {
  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiV1NamespacesNsQueuesNameScheduledMessages(ns, name, {
        page,
        pageSize,
      });
    },
    queryKeyPrefix: 'scheduled-messages',
    enableDelete: true,
    enableRequeue: false, // Scheduled messages can not be requeued
  };

  return useMessages(queueParams, config, initialPageSize);
}
