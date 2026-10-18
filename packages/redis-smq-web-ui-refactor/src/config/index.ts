/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

interface RsmqWebConfig {
  API_URL: string;
  BASE_PATH: string;
}

declare global {
  interface Window {
    configs?: Partial<RsmqWebConfig>;
  }
}

const FALLBACKS: RsmqWebConfig = {
  API_URL: 'http://127.0.0.1:3000/api',
  BASE_PATH: '/',
};

function resolve<K extends keyof RsmqWebConfig>(
  key: K,
  envValue: string | undefined,
): string {
  const fromWindow =
    typeof window !== 'undefined' ? window.configs?.[key] : undefined;
  return fromWindow ?? envValue ?? FALLBACKS[key];
}

export const API_URL = resolve('API_URL', import.meta.env.VITE_API_URL);
export const BASE_PATH = resolve('BASE_PATH', import.meta.env.VITE_BASE_PATH);
