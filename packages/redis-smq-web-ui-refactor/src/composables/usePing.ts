/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import { usePing as useOrvalPing } from '@/api/generated/diagnostics/diagnostics';
import { getErrorMessage } from '@/lib/error';
import { formatDuration } from '@/lib/format';

export function usePing() {
  const query = useOrvalPing({
    query: {
      refetchInterval: 30_000,
      retry: false,
      staleTime: 10_000,
    },
  });

  const isUp = computed(
    () => query.isSuccess.value && query.data.value?.data?.ok === true,
  );

  // The spec doesn't document the unit; Node's `process.uptime()` is
  // seconds, which is the convention. Formatter converts to ms for display.
  const uptimeFormatted = computed(() => {
    const seconds = query.data.value?.data?.uptime;
    if (typeof seconds !== 'number') return null;
    return formatDuration(seconds * 1000);
  });

  return {
    query,
    isUp,
    isChecking: computed(
      () => query.isLoading.value && query.data.value === undefined,
    ),
    uptimeFormatted,
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,
  };
}
