/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref } from 'vue';
import { getApiV1NamespacesNsQueuesNameAcknowledgedMessages } from '@/api/generated/acknowledged-messages/acknowledged-messages.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';

/**
 * Composable for acknowledged messages with delete capability but no requeue
 * (acknowledged messages have been successfully processed)
 */
export function useAcknowledgedMessages(
  queueParams: Ref<IQueueParams>,
  initialPageSize = 20,
) {
  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiV1NamespacesNsQueuesNameAcknowledgedMessages(ns, name, {
        page,
        pageSize,
      });
    },
    queryKeyPrefix: 'acknowledged-messages',
    enableDelete: true,
    enableRequeue: true, // Acknowledged messages can be requeued
  };

  return useMessages(queueParams, config, initialPageSize);
}
