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
        // Stop polling once the job reaches a terminal state. `completedAt`
        // is the spec-guaranteed marker (set exactly once the job ends);
        // FAILED/CANCELLED are checked additionally because those states
        // are surfaced to the UI. We deliberately do NOT require
        // `status === COMPLETED` (numeric 2) — the enum values aren't
        // named in the spec, and the E2E fixtures use the same
        // `completedAt` heuristic for the same reason.
        refetchInterval: (query) => {
          const job = query.state.data?.data;
          if (!job) return 1000;
          if (job.completedAt !== undefined) return false;
          if (job.status === EBackgroundJobStatus.FAILED) return false;
          if (job.status === EBackgroundJobStatus.CANCELLED) return false;
          return 1000;
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
      const j = job.value;
      if (!j) return false;
      return (
        j.completedAt !== undefined ||
        j.status === EBackgroundJobStatus.COMPLETED ||
        j.status === EBackgroundJobStatus.FAILED ||
        j.status === EBackgroundJobStatus.CANCELLED
      );
    }),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}
