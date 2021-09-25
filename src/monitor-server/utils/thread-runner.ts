import { IConfig } from '../../../types';
import { fork } from 'child_process';
import { join } from 'path';
import { readdirSync } from 'fs';

export function startThreads(config: IConfig, dir: string): void {
  readdirSync(dir)
    .filter((i) => i.match(/\.thread\.js$/))
    .forEach((filename) => {
      const filepath = join(dir, filename);
      const thread = fork(filepath);
      thread.on('error', (err) => {
        throw err;
      });
      thread.on('exit', (code, signal) => {
        throw new Error(
          `Thread [${filepath}] exited with code ${code} and signal ${signal}`,
        );
      });
      thread.send(JSON.stringify(config));
    });
}
