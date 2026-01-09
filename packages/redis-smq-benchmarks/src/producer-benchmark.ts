import { async, ICallback } from 'redis-smq-common';
import { ensureQueue } from './helpers/ensure-queue.js';
import { IBenchmarkResult } from './types/index.js';
import { BaseBenchmark } from './common/base-benchmark.js';
import { HighResTimer } from './helpers/timing.js';

export class ProducerBenchmark extends BaseBenchmark {
  protected async ensureQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      ensureQueue(this.queue, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public run(cb: ICallback<IBenchmarkResult>): void {
    console.log('Starting producer throughput benchmark...');
    console.log(
      `Queue: ${this.queue.ns}/${this.queue.name} | Messages: ${this.totalMessages} | Producers: ${this.workerCount}`,
    );

    const onComplete = (r: IBenchmarkResult) => {
      console.log('\n========== BENCHMARK COMPLETE ==========');
      console.log(`Total messages produced: ${r.totalMessages}`);
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
