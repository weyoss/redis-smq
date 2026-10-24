/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { computed } from 'vue';
import type { IRedisSMQConfig, IRedisSMQParsedConfig } from '@/api/model';
import {
  useGetConfiguration,
  useUpdateConfiguration,
} from '@/api/generated/configuration/configuration';
import { getErrorMessage } from '@/lib/error';

export function useConfiguration() {
  const query = useGetConfiguration();

  const mutation = useUpdateConfiguration({
    mutation: { onSuccess: () => query.refetch() },
  });

  return {
    query,
    config: computed<IRedisSMQParsedConfig | null>(
      () => query.data.value?.data ?? null,
    ),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => getErrorMessage(query.error.value) || null),
    refetch: query.refetch,

    update: (data: IRedisSMQConfig) => mutation.mutateAsync({ data }),
    isUpdating: computed(() => mutation.isPending.value),
    updateError: computed(() => getErrorMessage(mutation.error.value) || null),
    resetUpdate: mutation.reset,
  };
}
