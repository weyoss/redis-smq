/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed, toValue, type MaybeRefOrGetter } from 'vue';
import type { IMessageUnacknowledgementRecord } from '@/api/model';
import { useGetMessageUnacknowledgementHistory } from '@/api/generated/messages/messages';
import { getErrorMessage } from '@/lib/error';

export function useMessageUnackHistory(
  id: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const idRef = computed(() => toValue(id) ?? '');
  const isEnabled = computed(() => idRef.value.length > 0 && toValue(enabled));

  const query = useGetMessageUnacknowledgementHistory(idRef, {
    query: { enabled: isEnabled, retry: false },
  });

  const error = computed(() => getErrorMessage(query.error.value) || null);

  // Server returns 412 UnacknowledgmentHistoryDisabledError when the
  // feature isn't enabled in the config. Surface that as a distinct
  // state so the UI doesn't show it as a generic error.
  const isDisabled = computed(
    () =>
      !!error.value &&
      error.value.includes('UnacknowledgmentHistoryDisabledError'),
  );

  return {
    query,
    history: computed<IMessageUnacknowledgementRecord[]>(
      () => query.data.value?.data ?? [],
    ),
    isLoading: computed(() => query.isLoading.value),
    error: computed(() => (isDisabled.value ? null : error.value)),
    isDisabled,
    refetch: query.refetch,
  };
}
