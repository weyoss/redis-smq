/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { computed } from 'vue';
import type { PublishMessageBody } from '@/api/model';
import { usePublishMessage as useOrvalPublishMessage } from '@/api/generated/messages/messages';
import { getErrorMessage } from '@/lib/error';

export function usePublishMessage() {
  const mutation = useOrvalPublishMessage();

  async function publish(payload: PublishMessageBody): Promise<string[]> {
    const result = await mutation.mutateAsync({ data: payload });
    if (!result?.data) {
      throw new Error('Publish succeeded but returned no message IDs');
    }
    return result.data;
  }

  return {
    publish,
    isPending: computed(() => mutation.isPending.value),
    error: computed(() => getErrorMessage(mutation.error.value) || null),
    reset: mutation.reset,
  };
}
