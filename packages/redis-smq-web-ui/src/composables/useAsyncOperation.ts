/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ref, computed, type Ref } from 'vue';

export interface AsyncOperationOptions {
  /**
   * Initial loading state
   * @default false
   */
  initialLoading?: boolean;

  /**
   * Whether to reset error state before executing
   * @default true
   */
  resetErrorOnExecute?: boolean;

  /**
   * Whether to log errors to console
   * @default true
   */
  logErrors?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: unknown, context?: string) => void;

  /**
   * Success callback
   */
  onSuccess?: (result?: unknown) => void;

  /**
   * Finally callback (runs after success or error)
   */
  onFinally?: () => void;
}

export interface AsyncOperationReturn<T = unknown> {
  /**
   * Whether the operation is currently loading
   */
  isLoading: Ref<boolean>;

  /**
   * Current error state
   */
  error: Ref<unknown>;

  /**
   * Execute the async operation
   */
  execute: (...args: unknown[]) => Promise<T>;

  /**
   * Reset the operation state
   */
  reset: () => void;

  /**
   * Set loading state manually
   */
  setLoading: (loading: boolean) => void;

  /**
   * Set error state manually
   */
  setError: (error: unknown) => void;

  /**
   * Clear error state
   */
  clearError: () => void;
}

/**
 * Composable for handling async operations with loading and error states
 *
 * @param asyncFn - The async function to execute
 * @param context - Optional context string for logging/debugging
 * @param options - Configuration options
 * @returns Object with loading state, error state, and execute function
 *
 * @example
 * ```typescript
 * const { isLoading, error, execute } = useAsyncOperation(
 *   async (id: string) => {
 *     const response = await api.fetchUser(id);
 *     return response.data;
 *   },
 *   'Fetch User',
 *   {
 *     onSuccess: (user) => console.log('User loaded:', user),
 *     onError: (err) => console.error('Failed to load user:', err)
 *   }
 * );
 *
 * // Execute the operation
 * await execute('user-123');
 * ```
 */
export function useAsyncOperation<T = unknown>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  context?: string,
  options: AsyncOperationOptions = {},
): AsyncOperationReturn<T> {
  const {
    initialLoading = false,
    resetErrorOnExecute = true,
    logErrors = true,
    onError,
    onSuccess,
    onFinally,
  } = options;

  // Reactive state
  const isLoading = ref(initialLoading);
  const error = ref<unknown>(null);

  /**
   * Execute the async operation
   */
  async function execute(...args: unknown[]): Promise<T> {
    try {
      // Reset state
      isLoading.value = true;
      if (resetErrorOnExecute) {
        error.value = null;
      }

      // Execute the async function
      const result = await asyncFn(...args);

      // Handle success
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err: unknown) {
      // Set error state
      error.value = err;

      // Log error if enabled
      if (logErrors) {
        const contextMsg = context ? `[${context}]` : '';
        console.error(`${contextMsg} Async operation failed:`, err);
      }

      // Call custom error handler
      if (onError) {
        onError(err, context);
      }

      // Re-throw the error so callers can handle it if needed
      throw err;
    } finally {
      // Reset loading state
      isLoading.value = false;

      // Call finally callback
      if (onFinally) {
        onFinally();
      }
    }
  }

  /**
   * Reset the operation state
   */
  function reset(): void {
    isLoading.value = false;
    error.value = null;
  }

  /**
   * Set loading state manually
   */
  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  /**
   * Set error state manually
   */
  function setError(err: unknown): void {
    error.value = err;
  }

  /**
   * Clear error state
   */
  function clearError(): void {
    error.value = null;
  }

  return {
    isLoading,
    error,
    execute,
    reset,
    setLoading,
    setError,
    clearError,
  };
}

/**
 * Specialized version for operations that don't return data
 */
export function useAsyncAction(
  asyncFn: (...args: unknown[]) => Promise<void>,
  context?: string,
  options: AsyncOperationOptions = {},
): Omit<AsyncOperationReturn<void>, 'execute'> & {
  execute: (...args: unknown[]) => Promise<void>;
} {
  return useAsyncOperation(asyncFn, context, options);
}

/**
 * Type for async operation functions
 */
type AsyncOperationFunction = (...args: unknown[]) => Promise<unknown>;

/**
 * Type for operations record
 */
type OperationsRecord = Record<string, AsyncOperationFunction>;

/**
 * Multiple async operations manager
 */
export function useAsyncOperations<T extends OperationsRecord>(
  operations: T,
  globalOptions: AsyncOperationOptions = {},
): {
  [K in keyof T]: AsyncOperationReturn<Awaited<ReturnType<T[K]>>>;
} & {
  /**
   * Whether any operation is loading
   */
  isAnyLoading: Ref<boolean>;

  /**
   * All current errors
   */
  allErrors: Ref<Record<keyof T, unknown>>;

  /**
   * Reset all operations
   */
  resetAll: () => void;

  /**
   * Clear all errors
   */
  clearAllErrors: () => void;
} {
  type OperationResults = {
    [K in keyof T]: AsyncOperationReturn<Awaited<ReturnType<T[K]>>>;
  };

  const operationResults = {} as OperationResults;
  const loadingStates: Ref<boolean>[] = [];
  const errorStates: Ref<unknown>[] = [];

  // Create async operation for each provided operation
  for (const [key, asyncFn] of Object.entries(operations) as Array<
    [keyof T, T[keyof T]]
  >) {
    const result = useAsyncOperation(
      asyncFn as (
        ...args: unknown[]
      ) => Promise<Awaited<ReturnType<T[keyof T]>>>,
      `${String(key)} operation`,
      globalOptions,
    ) as AsyncOperationReturn<Awaited<ReturnType<T[keyof T]>>>;

    operationResults[key] = result;
    loadingStates.push(result.isLoading);
    errorStates.push(result.error);
  }

  // Computed properties for combined state
  const isAnyLoading = computed(() =>
    loadingStates.some((loading) => loading.value),
  );

  const allErrors = computed(() => {
    const errors = {} as Record<keyof T, unknown>;
    Object.keys(operations).forEach((key, index) => {
      errors[key as keyof T] = errorStates[index].value;
    });
    return errors;
  });

  /**
   * Reset all operations
   */
  function resetAll(): void {
    Object.values(operationResults).forEach((result) => {
      result.reset();
    });
  }

  /**
   * Clear all errors
   */
  function clearAllErrors(): void {
    Object.values(operationResults).forEach((result) => {
      result.clearError();
    });
  }

  return {
    ...operationResults,
    isAnyLoading,
    allErrors,
    resetAll,
    clearAllErrors,
  };
}

/**
 * Options for retry functionality
 */
interface RetryOptions extends AsyncOperationOptions {
  maxRetries?: number;
  retryDelay?: number;
  retryCondition?: (error: unknown, attempt: number) => boolean;
}

/**
 * Hook for handling async operations with automatic retry
 */
export function useAsyncOperationWithRetry<T = unknown>(
  asyncFn: (...args: unknown[]) => Promise<T>,
  context?: string,
  options: RetryOptions = {},
): AsyncOperationReturn<T> & {
  /**
   * Current retry attempt
   */
  retryAttempt: Ref<number>;

  /**
   * Whether operation is retrying
   */
  isRetrying: Ref<boolean>;

  /**
   * Retry the last failed operation
   */
  retry: () => Promise<T>;
} {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = () => true,
    ...baseOptions
  } = options;

  const retryAttempt = ref(0);
  const isRetrying = ref(false);
  let lastArgs: unknown[] = [];

  const baseOperation = useAsyncOperation(asyncFn, context, baseOptions);

  /**
   * Execute with retry logic
   */
  async function executeWithRetry(...args: unknown[]): Promise<T> {
    lastArgs = args;
    retryAttempt.value = 0;
    isRetrying.value = false;

    return attemptExecution();
  }

  /**
   * Attempt execution with retry logic
   */
  async function attemptExecution(): Promise<T> {
    try {
      const result = await baseOperation.execute(...lastArgs);
      retryAttempt.value = 0;
      isRetrying.value = false;
      return result;
    } catch (error) {
      if (
        retryAttempt.value < maxRetries &&
        retryCondition(error, retryAttempt.value + 1)
      ) {
        retryAttempt.value++;
        isRetrying.value = true;

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, retryDelay));

        return attemptExecution();
      } else {
        isRetrying.value = false;
        throw error;
      }
    }
  }

  /**
   * Retry the last failed operation
   */
  async function retry(): Promise<T> {
    if (lastArgs.length === 0) {
      throw new Error('No previous operation to retry');
    }
    return attemptExecution();
  }

  return {
    ...baseOperation,
    execute: executeWithRetry,
    retryAttempt,
    isRetrying,
    retry,
  };
}
