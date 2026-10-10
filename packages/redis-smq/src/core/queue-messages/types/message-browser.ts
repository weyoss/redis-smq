/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { EBackgroundJobStatus } from '../../common/background-jobs/types/index.js';
import { EQueueMessageType } from './queue-messages-registry.js';
import { TQueueExtendedParams } from '../../../contracts/index.js';
import { IMessageTransferable } from '../../../contracts/index.js';
import { IBrowserPage, IPurgeQueueJob } from '../../../contracts/index.js';

export interface IMessageBrowser {
  readonly messageType: EQueueMessageType;

  countMessages(queue: TQueueExtendedParams, cb: ICallback<number>): void;

  getMessages(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<IMessageTransferable>>,
  ): void;

  getMessageIds(
    queue: TQueueExtendedParams,
    page: number,
    pageSize: number,
    cb: ICallback<IBrowserPage<string>>,
  ): void;

  purge(queue: TQueueExtendedParams, cb: ICallback<string>): void;

  cancelPurge(queue: TQueueExtendedParams, jobId: string, cb: ICallback): void;

  getPurgeJobStatus(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<EBackgroundJobStatus>,
  ): void;

  getPurgeJob(
    queue: TQueueExtendedParams,
    jobId: string,
    cb: ICallback<IPurgeQueueJob>,
  ): void;
}

export interface IBrowserPageInfo {
  pageSize: number;
  currentPage: number;
  offsetStart: number;
  offsetEnd: number;
  totalPages: number;
}
