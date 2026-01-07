/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from 'redis-smq';
import { IRedisConfig } from 'redis-smq-common';

export enum EWorkerMessageType {
  PROGRESS = 'PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface IWorkerMessageData {
  workerId: number;
  processed: number;
  timeTaken: number;
  expected: number;
}

export interface IWorkerData {
  queue: IQueueParams;
  redisConfig: IRedisConfig;
  workerId: number;
  expectedMessages: number;
}

export interface IWorkerMessage {
  type: EWorkerMessageType;
  data: IWorkerMessageData;
}

export interface IBenchmarkConfig {
  redisConfig: IRedisConfig;
  queue: IQueueParams;
  totalMessages: number;
  workerCount: number;
  workerPath: string;
  workerLabel: string;
  showProgress: boolean;
}

export interface IE2EBenchmarkConfig {
  redisConfig: IRedisConfig;
  queue: IQueueParams;
  totalMessages: number;
  consumerCount: number;
  consumerWorkerPath: string;
  producerCount: number;
  producerWorkerPath: string;
  showProgress: boolean;
}

export interface IBenchmarkResult {
  total: number;
  totalTime: number;
  totalWorkerTime: number;
  workerCount: number;
}

export interface IE2EBenchmarkResult extends IBenchmarkResult {
  productionTime: number;
  consumptionTime: number;
  messagesProduced: number;
  messagesConsumed: number;
  endToEndLatency?: number;
  productionThroughput: number;
  consumptionThroughput: number;
}
