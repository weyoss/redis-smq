import { Worker } from '../worker';
import { ICallback } from '../../../../types';
import { each } from '../../../util/async';

export class WorkerPool {
  private pool: Worker[] = [];
  private index = 0;

  private getCurrentPoolItem = (): Worker | null => {
    if (this.pool.length) {
      const worker = this.pool[this.index];
      this.index += 1;
      if (this.index >= this.pool.length) {
        this.index = 0;
      }
      return worker;
    }
    return null;
  };

  work = (cb: ICallback<void>): void => {
    const worker = this.getCurrentPoolItem();
    if (worker) worker.work(cb);
    else cb();
  };

  add = (worker: Worker): number => {
    this.pool.push(worker);
    return this.pool.length;
  };

  clear = (cb: ICallback<void>): void => {
    each(
      this.pool,
      (worker, _, done) => {
        worker.quit(done);
      },
      () => {
        this.pool = [];
        this.index = 0;
        cb();
      },
    );
  };
}
