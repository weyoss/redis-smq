import { IConfig, ICallback } from '../../../types';
import { ChildProcess, fork } from 'child_process';
import { join } from 'path';
import { readdirSync } from 'fs';
import { PowerManager } from '../../system/power-manager';

const powerManager = new PowerManager();
const runningThreads: ChildProcess[] = [];

export function startThreads(config: IConfig, dir: string): void {
  powerManager.goingUp();
  readdirSync(dir)
    .filter((i) => i.match(/\.thread\.js$/))
    .forEach((filename) => {
      const filepath = join(dir, filename);
      const thread = fork(filepath);
      thread.on('error', (err) => {
        if (powerManager.isRunning()) {
          throw err;
        }
      });
      thread.on('exit', (code, signal) => {
        if (powerManager.isRunning()) {
          throw new Error(
            `Thread [${filepath}] exited with code ${code} and signal ${signal}`,
          );
        }
      });
      process.on('exit', () => {
        runningThreads.forEach((i) => i.kill());
      });
      thread.send(JSON.stringify(config));
      runningThreads.push(thread);
    });
  powerManager.commit();
}

export function stopThreads(cb?: ICallback<void>): void {
  powerManager.goingDown();
  if (runningThreads.length) {
    let total = runningThreads.length;
    while (runningThreads.length) {
      const thread = runningThreads.pop();
      if (thread) {
        thread.once('exit', () => {
          total = total - 1;
          if (!total) {
            powerManager.commit();
            cb && cb();
          }
        });
        thread.kill('SIGHUP');
      }
    }
  } else {
    powerManager.commit();
    cb && cb();
  }
}
