/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { env, net } from 'redis-smq-common';

export interface CliProcess {
  proc: ReturnType<typeof spawn>;
  url: string;
  stop(): Promise<void>;
  stdout: string[];
  stderr: string[];
}

export interface StartCliOptions {
  redisPort: number;
  args: string[];
  readyTimeoutMs?: number;
  port?: number;
}

function resolveCliPath(): string {
  const here = env.getCurrentDir();
  return resolve(here, '../../src/cli.js');
}

export async function startCli(options: StartCliOptions): Promise<CliProcess> {
  const {
    redisPort,
    args,
    readyTimeoutMs = 10_000,
    port: explicitPort,
  } = options;
  const port = explicitPort ?? (await net.getRandomPort());
  const cliPath = resolveCliPath();

  const proc = spawn(
    process.execPath,
    [
      cliPath,
      '--port',
      String(port),
      '--redis-port',
      String(redisPort),
      ...args,
    ],
    { env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] },
  );

  const stdout: string[] = [];
  const stderr: string[] = [];
  proc.stdout.on('data', (d: unknown) => stdout.push(String(d)));
  proc.stderr.on('data', (d: unknown) => stderr.push(String(d)));

  let exited = false;
  proc.once('exit', () => {
    exited = true;
  });

  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + readyTimeoutMs;

  while (Date.now() < deadline) {
    if (exited) {
      throw new Error(
        `CLI exited before becoming ready.\n` +
          `stderr:\n${stderr.join('')}\n` +
          `stdout:\n${stdout.join('')}`,
      );
    }
    try {
      await fetch(url);
      return makeHandle(proc, url, stdout, stderr);
    } catch {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  proc.kill('SIGKILL');
  throw new Error(
    `CLI did not become ready within ${readyTimeoutMs}ms.\n` +
      `stderr:\n${stderr.join('')}\n` +
      `stdout:\n${stdout.join('')}`,
  );
}

function makeHandle(
  proc: ReturnType<typeof spawn>,
  url: string,
  stdout: string[],
  stderr: string[],
): CliProcess {
  return {
    proc,
    url,
    stdout,
    stderr,
    stop: async () => {
      if (proc.exitCode !== null) return;
      proc.kill('SIGINT');
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, 500);
        proc.once('exit', () => {
          clearTimeout(timer);
          resolve(undefined);
        });
      });
      if (proc.exitCode === null && !proc.killed) {
        proc.kill('SIGKILL');
      }
    },
  };
}
