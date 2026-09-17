/*
 * packages/redis-smq/src/queue-messages/types/message-browser.ts
 */

import { TQueueExtendedParams } from '../../queue-manager/index.js';
import { ICallback } from 'redis-smq-common';
import { IMessageTransferable } from '../../message/index.js';
import { EBackgroundJobStatus } from '../../common/index.js';
import { EQueueMessageType } from './index.js';
import { TPurgeQueueJob } from '../../common/background-jobs/jobs/purge-queue/types/index.js';

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
    cb: ICallback<TPurgeQueueJob>,
  ): void;
}

export interface IBrowserPage<T> {
  totalItems: number;
  items: T[];
}

export interface IBrowserPageInfo {
  pageSize: number;
  currentPage: number;
  offsetStart: number;
  offsetEnd: number;
  totalPages: number;
}
