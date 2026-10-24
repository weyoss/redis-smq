/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IQueueParams } from '@/api/model';
import { useCountQueueMessages } from '@/api/generated/queue-messages/queue-messages';
import { getErrorMessage } from '@/lib/error';

export function useQueueStats(queue: MaybeRefOrGetter<IQueueParams | null>) {
  const params = computed(() => toValue(queue));
  const enabled = computed(() => params.value !== null);

  const query = useCountQueueMessages(
    computed(() => params.value?.ns ?? ''),
    computed(() => params.value?.name ?? ''),
    { groupBy: 'status' },
    { query: { enabled, staleTime: 5_000, retry: 2 } },
  );

  const byStatus = computed(() => {
    const v = query.data.value?.data;
    return v && typeof v === 'object' ? v : null;
  });

  const total = computed(() => {
    const v = query.data.value?.data;
    if (typeof v === 'number') return v;
    if (!v) return 0;
    return v.pending + v.acknowledged + v.deadLettered + v.scheduled;
  });

  const pending = computed(() => byStatus.value?.pending ?? 0);
  const acknowledged = computed(() => byStatus.value?.acknowledged ?? 0);
  const deadLettered = computed(() => byStatus.value?.deadLettered ?? 0);
  const scheduled = computed(() => byStatus.value?.scheduled ?? 0);

  const percentages = computed(() => {
    const t = total.value;
    const pct = (n: number) => (t > 0 ? Math.round((n / t) * 100) : 0);
    return {
      pending: pct(pending.value),
      acknowledged: pct(acknowledged.value),
      deadLettered: pct(deadLettered.value),
      scheduled: pct(scheduled.value),
    };
  });

  return {
    query,
    byStatus,
    total,
    pending,
    acknowledged,
    deadLettered,
    scheduled,
    percentages,
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}
