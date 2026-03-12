/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { GetApiV1NamespacesNsQueuesNameMessages200DataItemsItem } from '@/api/model/index.ts';

export enum EMessagePriority {
  HIGHEST,
  VERY_HIGH,
  HIGH,
  ABOVE_NORMAL,
  NORMAL,
  LOW,
  VERY_LOW,
  LOWEST,
}

export enum EMessageProperty {
  ID,
  STATUS,
  STATE,
  MESSAGE,
}

export enum EMessagePropertyStatus {
  NEW = 0,
  PENDING,
  PROCESSING,
  SCHEDULED,
  ACKNOWLEDGED,
  UNACK_REQUEUING,
  UNACK_DELAYING,
  DEAD_LETTERED,
}

export type IMessageTransferable =
  GetApiV1NamespacesNsQueuesNameMessages200DataItemsItem;
