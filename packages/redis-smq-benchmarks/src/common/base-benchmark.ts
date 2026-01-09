/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from 'redis-smq';
import { ICallback, IRedisConfig } from 'redis-smq-common';
import {
  EWorkerMessageType,
  IBenchmarkConfig,
  IBenchmarkResult,
  IWorkerCompleteMessage,
  TWorkerMessage,
  TWorkerMessageHandler,
} from '../types/index.js';
import { Worker } from 'worker_threads';
import { createWorker } from '../helpers/create-worker.js';
import { HighResTimer } from '../helpers/timing.js';
import { calculateBenchmarkResult } from '../helpers/calculate-benchmark-result.js';

export abstract class BaseBenchmark {
  protected showProgress = false;
  protected redisConfig: IRedisConfig;
  protected queue: IQueueParams;
  protected totalMessages: number;
  protected workerCount: number;
  protected workerPath: string;
  protected workerLabel: string;
  protected workers: Worker[] = [];
  protected workerResults: IWorkerCompleteMessage['data'][] = [];
  protected completedWorkers = 0;

  constructor(config: IBenchmarkConfig) {
    this.redisConfig = config.redisConfig;
    this.queue = config.queue;
    this.totalMessages = config.totalMessages;
    this.workerCount = config.workerCount;
    this.workerPath = config.workerPath;
    this.workerLabel = config.workerLabel;
    this.showProgress = config.showProgress;
  }

  protected abstract ensureQueue(): Promise<void> | void;

  protected calculateMessageDistribution(): {
    count: number;
    remainder: number;
  } {
    const messagesPerWorker = Math.floor(this.totalMessages / this.workerCount);
    const remainingMessages = this.totalMessages % this.workerCount;
    return { count: messagesPerWorker, remainder: remainingMessages };
  }

  protected createMessageHandler(
    onComplete: (r: IBenchmarkResult) => void,
  ): TWorkerMessageHandler {
    return (msg: TWorkerMessage) => {
      if (msg.type === EWorkerMessageType.COMPLETED) {
        this.completedWorkers++;
        this.workerResults.push(msg.data);

        const { workerId, processed, timeTaken } = msg.data;

        console.log(
          `${this.workerLabel} ${workerId} completed: ${processed} messages in ${HighResTimer.format(timeTaken)} (${(processed / HighResTimer.toSeconds(timeTaken)).toFixed(0)} msg/s)`,
        );

        if (this.completedWorkers === this.workerCount)
          this.shutdownWorkers()
            .then(() => {
              const r = calculateBenchmarkResult(this.workerResults);
              onComplete(r);
            })
            .catch(() => void 0);
      } else if (
        msg.type === EWorkerMessageType.PROGRESS &&
        this.showProgress
      ) {
        const { workerId, progress } = msg.data;
        console.log(
          `${this.workerLabel} ${workerId} progress: ${progress} messages`,
        );
      }
    };
  }

  protected async createWorkers(
    onMessage: TWorkerMessageHandler,
  ): Promise<void> {
    const { count: messagesPerWorker, remainder: remainingMessages } =
      this.calculateMessageDistribution();

    console.log(
      `Messages per ${this.workerLabel} (approx): ${messagesPerWorker}`,
    );

    for (let i = 0; i < this.workerCount; i++) {
      let workerMessageCount = messagesPerWorker;
      if (i < remainingMessages) {
        workerMessageCount += 1;
      }

      console.log(
        `${this.workerLabel} ${i + 1} will handle ${workerMessageCount} messages`,
      );

      const worker = createWorker({
        redisConfig: this.redisConfig,
        workerPath: this.workerPath,
        workerId: i,
        expectedMessages: workerMessageCount,
        queue: this.queue,
        onMessage,
      });
      this.workers.push(worker);
    }
  }

  protected async shutdownWorkers(): Promise<void> {
    await Promise.all(
      this.workers.map((worker) => {
        worker.removeAllListeners();
        return worker.terminate();
      }),
    ).catch(() => void 0);
  }

  public abstract run(cb: ICallback<IBenchmarkResult>): void;
}
