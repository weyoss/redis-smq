/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { getRandomPort } from '../net/index.js';

const PROCESS_LIST: Record<number, ChildProcess> = {};

async function getRedisBinPath(): Promise<string | null> {
  return new Promise((resolve) => {
    exec('which redis-server || where redis-server', (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export async function startRedisServer(redisPort?: number): Promise<number> {
  const redisBinPath = await getRedisBinPath();
  if (!redisBinPath) {
    throw new Error(`Redis binary not found.`);
  }
  const port = redisPort ?? (await getRandomPort());
  const process = spawn(redisBinPath, [
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
