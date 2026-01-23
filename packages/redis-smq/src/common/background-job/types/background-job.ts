/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export enum EBackgroundJobStatus {
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELED',
}

export interface IBackgroundJob<Target> {
  id: string;
  target: Target; // What the job operates on (queue name, file path, URL, etc.)
  status: EBackgroundJobStatus;
  createdAt: number;
  updatedAt?: number;
  startedAt?: number;
  completedAt?: number;

  // Job-specific fields (for queue purge jobs)
  batchSize?: number;
  delay?: number;
  purged?: number;
  error?: string;
}

export interface IBackgroundJobConfig {
  keyBackgroundJobs: string;
  keyBackgroundJobsPending: string;
  keyBackgroundJobsProcessing: string;
}
