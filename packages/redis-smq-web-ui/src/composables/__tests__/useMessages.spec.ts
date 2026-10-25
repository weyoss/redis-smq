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

    // Wait for the initial fetch to actually succeed. TanStack Query v5
    // batches state notifications through `notifyManager`, which uses
    // `setTimeout(0)` by default — so `flushPromises()` (a single
    // setTimeout(0)) resolves *before* TanStack's own batch fires.
    // The `query.data.value` ref is still undefined at that point, so
    // `totalCount` is 0 and `paginationInfo.totalPages` is 1; then
    // `goToPage(3)` short-circuits on `page > max`.
    //
    // `vi.waitFor` polls until the query succeeds, which is the actual
    // precondition `goToPage` needs. The `queryFn` call assertion
    // catches the other failure mode (query never started at all —
    // config.enabled mis-evaluated, missing plugin, etc.).
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
