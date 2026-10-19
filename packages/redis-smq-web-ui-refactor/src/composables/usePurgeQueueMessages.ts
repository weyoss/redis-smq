/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams, MessageStatus } from '@/api/model';
import { usePurgeQueueMessages as useOrvalPurge } from '@/api/generated/queue-messages/queue-messages';
import { getErrorMessage } from '@/lib/error';

export type PurgeScope = MessageStatus | 'all';

export function usePurgeQueueMessages(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  onSuccess?: () => void,
) {
  const params = computed(() => toValue(queue));
  const mutation = useOrvalPurge({
    mutation: { onSuccess: () => onSuccess?.() },
  });

  async function purge(scope: PurgeScope): Promise<void> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');

    // `params: {}` for "all" — the endpoint treats a missing `status` query
    // param as "purge every status". Passing `{}` is equivalent and satisfies
    // the generated `params?: PurgeQueueMessagesParams` slot either way.
    const queryParams = scope === 'all' ? {} : { status: scope };

    await mutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      params: queryParams,
    });
  }

  return {
    purge,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
