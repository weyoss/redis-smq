/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TFunction } from '../../common/index.js';

export type TTimerEvent = {
  error: (err: Error) => void;
};

export type TTimer = {
  timer: NodeJS.Timeout;
  periodic: boolean;
  fn: TFunction;
};
