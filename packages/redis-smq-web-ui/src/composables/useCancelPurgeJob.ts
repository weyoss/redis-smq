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
import { useCancelPurgeJob as useOrvalCancelPurgeJob } from '@/api/generated/queue-purge/queue-purge';
import { getErrorMessage } from '@/lib/error';

export function useCancelPurgeJob(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  status: MaybeRefOrGetter<MessageStatus | null>,
  jobId: MaybeRefOrGetter<string | null>,
) {
  const params = computed(() => toValue(queue));
  const statusRef = computed(() => toValue(status));
  const id = computed(() => toValue(jobId));
  const mutation = useOrvalCancelPurgeJob();

  async function cancel(): Promise<void> {
    const q = params.value;
    const s = statusRef.value;
    const jid = id.value;
    if (!q) throw new Error('Queue is required');
    if (!s) throw new Error('Status is required');
    if (!jid) throw new Error('Job ID is required');
    await mutation.mutateAsync({
      ns: q.ns,
      name: q.name,
      messageStatus: s,
      jobId: jid,
    });
  }

  return {
    cancel,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
