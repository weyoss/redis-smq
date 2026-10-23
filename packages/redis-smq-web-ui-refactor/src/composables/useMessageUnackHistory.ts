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
import { ApiError } from '@/api/axios-client';

export function useMessageUnackHistory(
  id: MaybeRefOrGetter<string | null>,
  enabled: MaybeRefOrGetter<boolean> = true,
) {
  const idRef = computed(() => toValue(id) ?? '');
  const isEnabled = computed(() => idRef.value.length > 0 && toValue(enabled));

  const query = useGetMessageUnacknowledgementHistory(idRef, {
    query: { enabled: isEnabled, retry: false },
  });

  // Server returns 412 UnacknowledgmentHistoryDisabledError when the
  // feature isn't enabled in the config. Match on the (code, message)
  // pair of the raw error rather than substring-matching the unwrapped
  // message string: substring matching would misclassify any other
  // error whose description happened to mention that name, and the
  // raw error carries the structural code we actually want to branch
  // on. The spec pins both fields (`code: 412`, exact message), so
  // they're stable.
  const isDisabled = computed(() => {
    const err = query.error.value;
    if (!err) return false;

    // Primary path — after the ApiError rollout, customInstance throws
    // an Error subclass that carries the envelope's code and message.
    if (err instanceof ApiError) {
      return (
        err.code === 412 &&
        err.message === 'UnacknowledgmentHistoryDisabledError'
      );
    }

    // Defensive fallback for the legacy plain-object envelope shape
    // (pre-ApiError callers, or a custom interceptor that re-shapes
    // the thrown error). Non-matching shapes fall through to `false`.
    const envelope = (err as { error?: { code?: number; message?: string } })
      .error;
    return (
      envelope?.code === 412 &&
      envelope?.message === 'UnacknowledgmentHistoryDisabledError'
    );
  });

  // Only surface real errors. When the endpoint reports "feature off",
  // the modal renders the disabled state instead and hides the error.
  const error = computed(() => {
    if (isDisabled.value) return null;
    return getErrorMessage(query.error.value) || null;
  });

  return {
    query,
    history: computed<IMessageUnacknowledgementRecord[]>(
      () => query.data.value?.data ?? [],
    ),
    isLoading: computed(() => query.isLoading.value),
    error,
    isDisabled,
    refetch: query.refetch,
  };
}
