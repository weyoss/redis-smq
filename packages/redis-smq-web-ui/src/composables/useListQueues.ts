/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { computed } from 'vue';
import { useGetAllQueues } from '@/api/generated/queues/queues';
import { getErrorMessage } from '@/lib/error';

export function useListQueues() {
  const query = useGetAllQueues();

  const queues = computed(() => query.data.value?.data ?? []);

  const sortedQueues = computed(() =>
    [...queues.value].sort(
      (a, b) => a.ns.localeCompare(b.ns) || a.name.localeCompare(b.name),
    ),
  );

  return {
    query,
    queues,
    sortedQueues,
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}
