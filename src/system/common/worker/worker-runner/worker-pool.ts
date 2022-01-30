import { Worker } from '../worker';
import { ICallback } from '../../../../../types';
import { each } from '../../../lib/async';

export class WorkerPool {
  private pool: Worker[] = [];
  private currentIndex = 0;

  private getCurrentPoolItem = (): Worker | null => {
    if (this.pool.length) {
      const index = this.getSetIndex();
      return this.pool[index];
    }
    return null;
  };

  private getSetIndex = (): number => {
    const index = this.currentIndex;
    this.currentIndex += 1;
    if (this.currentIndex === this.pool.length) {
      this.currentIndex = 0;
    }
    return index;
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
        cb();
      },
    );
  };
}
