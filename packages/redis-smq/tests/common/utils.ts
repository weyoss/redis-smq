/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import _ from 'lodash';

export const isEqual = (a: unknown[], b: unknown[]) =>
  _.isMatch([a], [b]) && _.isMatch([b], [a]);
