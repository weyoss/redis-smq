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

const instance = axios.create({
  baseURL: API_URL.replace(/\/+$/, ''),
  headers: { 'Content-Type': 'application/json' },
});

export type Cancellable<T> = Promise<T> & { cancel: () => void };

export function customInstance<T>(config: AxiosRequestConfig): Cancellable<T> {
  const controller = new AbortController();
  const promise = instance({ ...config, signal: controller.signal })
    .then((response: AxiosResponse<T>) => response.data)
    .catch((err: AxiosError) => {
      const data = err.response?.data as { error?: unknown } | undefined;
      if (data && typeof data === 'object' && 'error' in data) {
        throw { error: data.error };
      }
      throw err;
    }) as Cancellable<T>;

  promise.cancel = () => controller.abort();
  return promise;
}

export default instance;
