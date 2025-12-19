/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { type Ref, watch } from 'vue';

type EscapeKeyHandler = {
  isVisible: Ref<boolean>;
  onEscape: () => void;
};

/**
 * Composable for handling escape key press events
 * @param handlers Array of handlers with visibility state and escape callback
 */
export function useEscapeKey(handlers: EscapeKeyHandler[]): void {
  // Watch all visibility refs
  watch(
    handlers.map((handler) => handler.isVisible),
    (newValues) => {
      // Check if any handler is visible
      const isAnyVisible = newValues.some((value) => value);

      if (isAnyVisible) {
        // Add event listener for Escape key
        const handleEscape = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
            // Find the first visible handler and call its onEscape callback
            for (const handler of handlers) {
              if (handler.isVisible.value) {
                handler.onEscape();
                break;
              }
            }
          }
        };

        window.addEventListener('keydown', handleEscape);

        // Cleanup
        return () => {
          window.removeEventListener('keydown', handleEscape);
        };
      }
    },
    { immediate: true },
  );
}
