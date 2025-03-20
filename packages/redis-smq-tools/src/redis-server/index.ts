/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { spawn, ChildProcess } from 'child_process';
import axios from 'axios';
import { createWriteStream } from 'node:fs';
import { access, mkdir, constants, open, unlink } from 'node:fs/promises';
import * as tar from 'tar';
import * as path from 'path';
import { getRandomPort } from '../net/index.js';

const REDIS_VERSION = 'stable';
const PROCESS_LIST: Record<number, ChildProcess> = {};

function isError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

async function createDir(dir: string): Promise<void> {
  try {
    await access(dir, constants.F_OK);
  } catch {
    await mkdir(dir, { recursive: true });
    console.log(`Directory ${dir} created.`);
  }
}

async function downloadRedis(workingDir: string): Promise<void> {
  const tarball = path.join(workingDir, `redis-${REDIS_VERSION}.tar.gz`);
  try {
    await access(tarball, constants.F_OK);
  } catch {
    console.log(`Downloading Redis ${REDIS_VERSION}...`);
    const response = await axios<
      NodeJS.ReadableStream,
      { data: NodeJS.ReadableStream }
    >({
      url: `https://download.redis.io/redis-${REDIS_VERSION}.tar.gz`,
      responseType: 'stream',
    });
    const writer = createWriteStream(tarball);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }
}

async function extractRedis(workingDir: string): Promise<void> {
  const tarball = path.join(workingDir, `redis-${REDIS_VERSION}.tar.gz`);
  console.log(`Extracting Redis ${REDIS_VERSION}...`);
  await tar.x({
    file: tarball,
    C: workingDir,
  });
}

async function compileRedis(workingDir: string): Promise<void> {
  const redisSrcDir = path.join(workingDir, `redis-${REDIS_VERSION}`);
  console.log(`Compiling Redis...`);
  return new Promise((resolve, reject) => {
    const makeProcess = spawn('make', [], { cwd: redisSrcDir });
    makeProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Redis compilation failed.'));
      }
    });
  });
}

async function acquireLock(lockFile: string): Promise<void> {
  try {
    const fd = await open(lockFile, 'wx');
    await fd.close();
  } catch (err: unknown) {
    if (isError(err) && err.code === 'EEXIST') {
      await new Promise((resolve) => setTimeout(resolve, 100)); // Wait and retry
      await acquireLock(lockFile);
    } else {
      throw err;
    }
  }
}

async function releaseLock(lockFile: string): Promise<void> {
  try {
    await unlink(lockFile);
  } catch (err: unknown) {
    if (isError(err) && err.code !== 'ENOENT') {
      throw err;
    }
  }
}

async function setUpRedis(workingDir: string): Promise<void> {
  const lockFile = path.join(workingDir, 'setup.lock');
  const redisBin = path.join(
    workingDir,
    `redis-${REDIS_VERSION}`,
    'src',
    'redis-server',
  );
  try {
    await createDir(workingDir);
    await acquireLock(lockFile);
    try {
      await access(redisBin, constants.F_OK);
    } catch {
      await downloadRedis(workingDir);
      await extractRedis(workingDir);
      await compileRedis(workingDir);
    }
  } finally {
    await releaseLock(lockFile);
  }
}

export async function startRedisServer(
  workingDir: string,
  redisPort?: number,
): Promise<number> {
  const dir = path.resolve(workingDir);
  await setUpRedis(dir);
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
