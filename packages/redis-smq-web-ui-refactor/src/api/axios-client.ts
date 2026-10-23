/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';
import { API_URL } from '@/config';

/**
 * Server-side error envelope as returned by redis-smq-rest-api:
 *   { error: { code: 404, message: 'QueueNotFoundError', details?: { … } } }
 *
 * Kept as a distinct class (rather than a plain object) so that:
 *   - `instanceof Error` is true — stack traces, dev-tools logging, and
 *     `catch (e) { if (e instanceof Error) … }` all work as expected.
 *   - The original `code` is available for callers that want to branch
 *     (e.g. `409` → "already exists" UX) without string-matching on
 *     the message.
 *   - `getErrorMessage` still returns just the message because its
 *     `instanceof Error` branch runs first.
 */
export class ApiError extends Error {
  public readonly code: number;
  public readonly details?: Record<string, unknown>;

  constructor(envelope: {
    code: number;
    message: string;
    details?: Record<string, unknown>;
  }) {
    super(envelope.message);
    this.name = 'ApiError';
    this.code = envelope.code;
    this.details = envelope.details;
  }
}

const instance = axios.create({
  baseURL: API_URL.replace(/\/+$/, ''),
  headers: { 'Content-Type': 'application/json' },
  paramsSerializer: {
    // OpenAPI's default for arrays is `style: form, explode: true`
    // (i.e. `?ids=a&ids=b`), not `?ids[]=a&ids[]=b`. Axios's default
    // adds the `[]` suffix. `indexes: null` tells axios to skip the
    // suffix and repeat the key.
    indexes: null,
  },
});

export type Cancellable<T> = Promise<T> & { cancel: () => void };

export function customInstance<T>(config: AxiosRequestConfig): Cancellable<T> {
  const controller = new AbortController();
  const promise = instance({ ...config, signal: controller.signal })
    .then((response: AxiosResponse<T>) => response.data)
    .catch((err: AxiosError) => {
      const data = err.response?.data as { error?: unknown } | undefined;
      if (
        data &&
        typeof data === 'object' &&
        'error' in data &&
        data.error &&
        typeof (data.error as { message?: unknown }).message === 'string'
      ) {
        const envelope = data.error as {
          code: number;
          message: string;
          details?: Record<string, unknown>;
        };
        throw new ApiError(envelope);
      }
      // No envelope → transport-level failure (timeout, network, CORS…).
      // Re-throw the AxiosError so callers still get a proper Error with
      // a stack and `isAxiosError === true`.
      throw err;
    }) as Cancellable<T>;

  promise.cancel = () => controller.abort();
  return promise;
}

export default instance;
