/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { defineComponent, nextTick, ref } from 'vue';
import { useMessages } from '../useMessages.js';

import type { Plugin } from 'vue';

vi.mock('@/api/generated/messages/messages', () => ({
  useDeleteMessageById: vi.fn(),
  useRequeueMessageById: vi.fn(),
}));

function withQueryClient() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const plugins: [Plugin, ...unknown[]][] = [[VueQueryPlugin, { queryClient }]];
  return { global: { plugins } };
}

describe('useMessages', () => {
  it('resets to page 1 when queryKeyPrefix changes', async () => {
    const prefix = ref('tab-a');
    const queue = ref({ ns: 'ns', name: 'q' });
    const queryFn = vi.fn(async () => ({
      data: { items: [], totalItems: 100 },
    }));

    let composable!: ReturnType<typeof useMessages>;

    const Host = defineComponent({
      setup() {
        composable = useMessages(queue, {
          queryKeyPrefix: () => prefix.value,
          queryFn,
        });
        return () => null;
      },
    });

    mount(Host, withQueryClient());

    // Wait for the initial fetch to actually succeed. `flushPromises()`
    // resolves after a single setTimeout(0), but TanStack Query v5's
    // notifyManager batches state updates through its own setTimeout(0)
    // that fires *after* flushPromises' callback. So `query.data.value`
    // is still undefined at that point, `totalCount` is 0,
    // `paginationInfo.totalPages` is 1, and `goToPage(3)` short-circuits
    // on `page > max`.
    await vi.waitFor(() => {
      expect(queryFn).toHaveBeenCalled();
      expect(composable.query.isSuccess.value).toBe(true);
    });

    composable.goToPage(3);
    await nextTick();
    expect(composable.pagination.value.currentPage).toBe(3);

    prefix.value = 'tab-b';
    await nextTick();
    await nextTick();
    expect(composable.pagination.value.currentPage).toBe(1);
  });

  it('preserves current page on refresh()', async () => {
    const queue = ref({ ns: 'ns', name: 'q' });
    const queryFn = vi.fn(async () => ({
      data: { items: [], totalItems: 100 },
    }));

    let composable!: ReturnType<typeof useMessages>;

    const Host = defineComponent({
      setup() {
        composable = useMessages(queue, {
          queryKeyPrefix: 'fixed',
          queryFn,
        });
        return () => null;
      },
    });

    mount(Host, withQueryClient());

    // Same as above — wait for the query to succeed so totalPages > 1
    // before calling goToPage(2).
    await vi.waitFor(() => {
      expect(queryFn).toHaveBeenCalled();
      expect(composable.query.isSuccess.value).toBe(true);
    });

    composable.goToPage(2);
    await nextTick();
    expect(composable.pagination.value.currentPage).toBe(2);

    await composable.refresh();
    expect(composable.pagination.value.currentPage).toBe(2);
  });
});
