/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EMessagePropertyStatus {
  NEW = 0,
  PENDING = 1,
  PROCESSING = 2,
  SCHEDULED = 3,
  ACKNOWLEDGED = 4,
  UNACK_REQUEUING = 5,
  UNACK_DELAYING = 6,
  DEAD_LETTERED = 7,
}
