import { async, ICallback } from 'redis-smq-common';
import { ensureQueue } from './helpers/ensure-queue.js';
import { prefillQueue } from './helpers/prefill-queue.js';
import { IBenchmarkResult } from './types/index.js';
import { BaseBenchmark } from './common/base-benchmark.js';
import { HighResTimer } from './helpers/timing.js';

export class ConsumerBenchmark extends BaseBenchmark {
  protected async ensureQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      ensureQueue(this.queue, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  protected async prefillQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      prefillQueue(this.queue, this.totalMessages, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public run(cb: ICallback<IBenchmarkResult>): void {
    console.log('Starting consumer throughput benchmark...');
    console.log(
      `Queue: ${this.queue.ns}/${this.queue.name} | Messages: ${this.totalMessages} | Consumers: ${this.workerCount}`,
    );

    const onComplete = (r: IBenchmarkResult) => {
      console.log('\n========== BENCHMARK COMPLETE ==========');
      console.log(`Total messages consumed: ${r.totalMessages}`);
      console.log(`Total time: ${HighResTimer.format(r.totalTimeNs)}`);
      console.log(`Overall throughput: ${r.throughput} messages/second`);
      console.log('========================================\n');
      cb();
    };

    async.series(
      [
        (cb) =>
          this.ensureQueue()
            .then(() => cb())
            .catch(cb),
        (cb) =>
          this.prefillQueue()
            .then(() => cb())
            .catch(cb),
        (cb) => {
          const messageHandler = this.createMessageHandler(onComplete);
          this.createWorkers(messageHandler)
            .then(() => cb())
            .catch(cb);
        },
      ],
      (err) => {
        if (err) cb(err);
      },
    );
  }
}
