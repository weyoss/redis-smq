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
import { useStartPurge } from '@/api/generated/queue-purge/queue-purge';
import { getErrorMessage } from '@/lib/error';

export function usePurgeQueueMessages(
  queue: MaybeRefOrGetter<IQueueParams | null>,
) {
  const params = computed(() => toValue(queue));
  const mutation = useStartPurge();

  /**
   * Trigger an async purge. `status` is the browse-API filter:
   *   - 'published'      → every message regardless of current status
   *   - other statuses   → only messages currently in that state
   * The same value is required in the follow-up URLs
   * (.../purge/{messageStatus}/{jobId}).
   */
  async function purge(status: MessageStatus): Promise<{ jobId: string }> {
    const q = params.value;
    if (!q) throw new Error('Queue is required');

    const result = await mutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      messageStatus: status,
    });

    const jobId = result?.data?.jobId;
    if (!jobId) throw new Error('Purge accepted but returned no job ID');
    return { jobId };
  }

  return {
    purge,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
