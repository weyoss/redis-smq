/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams, IPurgeQueueJob, MessageStatus } from '@/api/model';
import { useGetPurgeJob } from '@/api/generated/queue-purge/queue-purge';
import { getErrorMessage } from '@/lib/error';
import { EBackgroundJobStatus } from '@/types/queues';

export function usePurgeQueueJob(
  queue: MaybeRefOrGetter<IQueueParams | null>,
  status: MaybeRefOrGetter<MessageStatus | null>,
  jobId: MaybeRefOrGetter<string | null>,
) {
  const params = computed(() => toValue(queue));
  const statusRef = computed(() => toValue(status));
  const id = computed(() => toValue(jobId));

  const query = useGetPurgeJob(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    computed(() => statusRef.value ?? 'published'),
    computed(() => id.value ?? ''),
    {
      query: {
        enabled: computed(
          () => !!params.value && !!statusRef.value && !!id.value,
        ),
        retry: false,
        // Poll every 1s while PENDING (0) or RUNNING (1); stop on any
        // terminal state (COMPLETED / FAILED / CANCELLED).
        refetchInterval: (query) => {
          const s = query.state.data?.data?.status;
          if (s === undefined) return 1000;
          if (
            s === EBackgroundJobStatus.PENDING ||
            s === EBackgroundJobStatus.RUNNING
          ) {
            return 1000;
          }
          return false;
        },
      },
    },
  );

  const job = computed<IPurgeQueueJob | null>(
    () => query.data.value?.data ?? null,
  );

  return {
    query,
    job,
    isTerminal: computed(() => {
      const s = job.value?.status;
      return (
        s === EBackgroundJobStatus.COMPLETED ||
        s === EBackgroundJobStatus.FAILED ||
        s === EBackgroundJobStatus.CANCELLED
      );
    }),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}
