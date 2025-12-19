/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { eachIn } from './each-in.js';
import { eachOf } from './each-of.js';
import { each } from './each.js';
import { exec } from './exec.js';
import { map } from './map.js';
import { series } from './series.js';
import { waterfall } from './waterfall.js';
import { parallel } from './parallel.js';
import { withCallbackList } from './with-callback-list.js';
import { withCallback } from './with-callback.js';
import { withRetry } from './with-retry.js';
import { withTimeout } from './with-timeout.js';

/**
 * A utility providing generic callback handling functions
 *
 * This helper centralizes common callback patterns and error handling
 * to ensure consistent behavior across the application.
 */
export const async = {
  each,
  eachIn,
  eachOf,
  exec,
  map,
  parallel,
  series,
  waterfall,
  withCallback,
  withCallbackList,
  withRetry,
  withTimeout,
};
