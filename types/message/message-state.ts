/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface IMessageStateSerialized {
  uuid: string;
  publishedAt: number | null;
  scheduledAt: number | null;
  lastScheduledAt: number | null;
  scheduledCronFired: boolean;
  attempts: number;
  scheduledRepeatCount: number;
  expired: boolean;
  nextScheduledDelay: number;
  nextRetryDelay: number;
  scheduledTimes: number;
  scheduledMessageId: string | null;
}
