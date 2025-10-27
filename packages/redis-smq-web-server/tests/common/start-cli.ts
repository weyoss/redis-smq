import { spawn } from 'child_process';
import { env, net } from 'redis-smq-common';
import path from 'path';
import { config } from './config.js';
import request from 'supertest';

export type StartedProcess = {
  proc: ReturnType<typeof spawn>;
  url: string;
  stop: () => Promise<void>;
  stdout: string[];
  stderr: string[];
};

export async function startCliWithArgs(
  args: string[],
): Promise<StartedProcess> {
  const node = process.execPath;
  const currentDir = env.getCurrentDir();
  const cliPath = path.resolve(currentDir, '../../bin/cli.js');
  const port = await net.getRandomPort();
  const finalArgs = [
    cliPath,
    '--port',
    String(port),
    '--redis-port',
    String(config.redis?.options?.port),
    ...args,
  ];

  const proc = spawn(node, finalArgs, {
    env: {
      ...process.env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const stdout: string[] = [];
  const stderr: string[] = [];
  proc.stdout.on('data', (d: unknown) => stdout.push(String(d)));
  proc.stderr.on('data', (d: unknown) => stderr.push(String(d)));

  // Wait for server to be ready by polling HTTP
  const url = `http://127.0.0.1:${port}`;
  const deadline = Date.now() + 10000;
  let lastErr: unknown;

  while (Date.now() < deadline) {
    try {
      // Either SPA route or redirect is fine; we just need readiness
      await request(url).get('/').timeout({ deadline: 2000 });
      break;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  if (Date.now() >= deadline) {
    proc.kill('SIGKILL');
    throw new Error(
      `CLI server did not start in time. stderr:\n${stderr.join('')}\nLastErr: ${String(lastErr)}`,
    );
  }

  const stop = async () => {
    // Send SIGINT and wait a bit, then SIGKILL if needed
    proc.kill('SIGINT');
    await new Promise((r) => setTimeout(r, 200));
    if (!proc.killed) proc.kill('SIGKILL');
  };

  return { proc, url, stop, stdout, stderr };
}
