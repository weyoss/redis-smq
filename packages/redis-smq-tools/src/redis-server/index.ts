/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { getRandomPort } from '../net/index.js';

const REDIS_VERSION = 'stable';
const PROCESS_LIST: Record<number, ChildProcess> = {};

export async function startRedisServer(
  workingDir: string,
  redisPort?: number,
): Promise<number> {
  const dir = path.resolve(workingDir);
  const redisBin = path.join(
    dir,
    `redis-${REDIS_VERSION}`,
    'src',
    'redis-server',
  );
  const port = redisPort ?? (await getRandomPort());
  const process = spawn(redisBin, [
    '--appendonly',
    'no',
    '--save',
    '',
    '--port',
    port.toString(),
  ]);

  PROCESS_LIST[port] = process;

  process.stderr.on('data', (data: unknown) => {
    console.error(`Redis stderr: ${data}`);
  });
  process.on('close', () => {
    delete PROCESS_LIST[port];
  });

  // Wait for Redis to start
  await new Promise<void>((resolve) => {
    const ready = (data: string) => {
      if (String(data).indexOf('Ready to accept connections') >= 0) {
        process.stdout.removeListener('data', ready);
        resolve();
      }
    };
    process.stdout.on('data', ready);
  });
  return port;
}

export async function shutdownRedisServer(port: number): Promise<void> {
  if (PROCESS_LIST[port]) {
    PROCESS_LIST[port].kill('SIGKILL');
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        delete PROCESS_LIST[port];
        resolve();
      }, 2000);
    });
  }
}

export async function cleanUp() {
  for (const port in PROCESS_LIST) {
    await shutdownRedisServer(parseInt(port));
  }
}

process.on('SIGINT', async () => {
  await cleanUp();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await cleanUp();
  process.exit(0);
});
