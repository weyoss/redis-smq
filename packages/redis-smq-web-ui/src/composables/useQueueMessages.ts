/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref } from 'vue';
import { getApiV1NamespacesNsQueuesNameMessages } from '@/api/generated/queue-messages/queue-messages.ts';
import {
  useMessages,
  type MessagesQueryConfig,
} from '@/composables/useMessages';
import type { IQueueParams } from '@/types/index.ts';

/**
 * Composable for all queue messages with full delete and requeue capabilities
 */
export function useQueueMessages(
  queueParams: Ref<IQueueParams>,
  initialPageSize = 20,
) {
  const config: MessagesQueryConfig = {
    queryFn: async ({ ns, name, page, pageSize }) => {
      return getApiV1NamespacesNsQueuesNameMessages(ns, name, {
        page,
        pageSize,
      });
    },
    queryKeyPrefix: 'queue-messages',
    enableDelete: true,
    enableRequeue: true,
  };

  return useMessages(queueParams, config, initialPageSize);
}
