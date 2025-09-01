/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { GetApiV1NamespacesNsQueuesNameMessages200DataItemsItem } from '@/api/model';

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
  UNPUBLISHED = -1,
  SCHEDULED,
  PENDING,
  PROCESSING,
  ACKNOWLEDGED,
  UNACK_DELAYING,
  UNACK_REQUEUING,
  DEAD_LETTERED,
}

export type IMessageTransferable =
  GetApiV1NamespacesNsQueuesNameMessages200DataItemsItem;
