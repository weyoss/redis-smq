/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSelectedNamespaceStore = defineStore(
  'selectedNamespace',
  () => {
    const selectedNamespace = ref<string | null>(null);

    function selectNamespace(ns: string): void {
      selectedNamespace.value = ns;
    }

    function clearSelectedNamespace(): void {
      selectedNamespace.value = null;
    }

    return {
      selectedNamespace,
      selectNamespace,
      clearSelectedNamespace,
    };
  },
);
