/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

// redis-smq/component-registry.ts
import { Disposable } from '../common/types/disposable.js';
import { ICallback } from 'redis-smq-common';

function isDisposable(disposable: unknown): disposable is Disposable {
  return (
    !!disposable &&
    typeof disposable === 'object' &&
    'shutdown' in disposable &&
    typeof disposable.shutdown === 'function'
  );
}

export class ComponentRegistry {
  // Track all disposable components created through factories
  private static readonly components = new Set<Disposable>();

  /**
   * Track a component that has a shutdown method
   * This should be called by factories when creating new instances
   */
  static track<T extends object>(instance: T): T {
    if (isDisposable(instance)) {
      ComponentRegistry.components.add(instance);
    }
    return instance;
  }

  /**
   * Remove a component from tracking
   * Useful for manual cleanup
   */
  static untrack(component: Disposable): boolean {
    return ComponentRegistry.components.delete(component);
  }

  /**
   * Gracefully shutdown all tracked components
   * This is called during RedisSMQ shutdown
   */
  static shutdownComponents(cb: ICallback): void {
    const toShutdown = Array.from(ComponentRegistry.components);

    // If no components to shut down, callback immediately
    if (toShutdown.length === 0) {
      return cb();
    }

    let pending = toShutdown.length;
    let firstErr: Error | null = null;

    toShutdown.forEach((component) => {
      try {
        component.shutdown((err) => {
          if (err && !firstErr) {
            firstErr = err;
          }

          // Remove from registry regardless of success/failure
          ComponentRegistry.components.delete(component);

          // When all components are done, callback with first error (if any)
          if (--pending === 0) {
            cb(firstErr || null);
          }
        });
      } catch (syncError) {
        // Handle synchronous errors during shutdown call
        if (!firstErr && syncError instanceof Error) {
          firstErr = syncError;
        }

        // Remove from registry on error
        ComponentRegistry.components.delete(component);

        if (--pending === 0) {
          cb(firstErr || null);
        }
      }
    });
  }

  /**
   * Clear all tracking and waiters
   * Used during reset/shutdown
   */
  static clear(): void {
    ComponentRegistry.components.clear();
  }

  /**
   * Get the number of currently tracked components
   */
  static get size(): number {
    return ComponentRegistry.components.size;
  }

  /**
   * Check if a specific component is being tracked
   */
  static has(component: Disposable): boolean {
    return ComponentRegistry.components.has(component);
  }
}
