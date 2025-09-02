/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { getConfig } from '@/config/index.ts';
import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
} from 'axios';

// Get the API URL from the window.configs object or use a default
const apiUrl = getConfig('API_URL').replace(/\/+$/, '');

// Create the axios instance
const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// This is the mutator function that Orval expects
export const customInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  const source = axios.CancelToken.source();
  const promise = axiosInstance({
    ...config,
    cancelToken: source.token,
  })
    .then((response: AxiosResponse<T>) => response.data)
    .catch((err: AxiosError) => {
      // @ts-expect-error err.response.data is of type unknown
      if (err.response?.data.error) {
        // @ts-expect-error Property error does not exist on type {}
        throw { error: err.response.data.error };
      }
      throw err;
    });

  // @ts-expect-error cancel is not defined
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

// Also export the axios instance for other uses
export default axiosInstance;
