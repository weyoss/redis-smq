/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { IRedisSMQWebUIConfig } from '@/config/types/index.js';

// Create a global declaration to extend the Window interface
declare global {
  interface Window {
    configs: IRedisSMQWebUIConfig;
  }
}

// Initialize the configs object if it doesn't exist
if (typeof window !== 'undefined' && !window.configs) {
  window.configs = {
    API_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api',
    BASE_PATH: import.meta.env.VITE_BASE_PATH || '/',
  };
}

// Helper function to get config values with type safety
export function getConfig<K extends keyof IRedisSMQWebUIConfig>(
  key: K,
): IRedisSMQWebUIConfig[K] {
  const value = window.configs[key];
  if (value === undefined) {
    throw new Error(`Environment variable "${key}" is not defined`);
  }
  return value;
}
