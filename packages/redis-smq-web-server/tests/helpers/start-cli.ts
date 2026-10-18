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

/**
 * A spawned `redis-smq-web-server` CLI process.
 *
 * Unlike the in-process helpers (`startWebServer`, `startApi`), the
 * CLI helper spawns a child process. That makes it the only way to
 * exercise:
 *
 *   - Argument parsing (commander).
 *   - Config assembly from string flags.
 *   - Error handling on invalid input (`process.exit(1)`).
 *   - Signal handling (`SIGINT`, `SIGTERM`).
 *
 * Everything else — routing, SPA fallback, proxying — is covered by
 * the in-process tests, where startup is faster and failure modes are
 * easier to diagnose.
 *
 * The helper is responsible for two things the tests shouldn't repeat:
 *
 *   1. **Port allocation.** It picks a random free port and passes it
 *      to the CLI as `--port`. The test asserts on the returned
 *      `url`; it never constructs one.
 *
 *   2. **Readiness polling.** It waits until the CLI's HTTP listener
 *      responds before resolving. If the process exits or never
 *      becomes reachable within the timeout, the helper throws with
 *      the captured stderr, so a test failure points at the config
 *      that broke the process, not at a mystery HTTP timeout.
 */
export interface CliProcess {
  /** The spawned child process. Exposed for tests that want to assert on exit codes. */
  proc: ReturnType<typeof spawn>;

  /** Base URL of the running CLI, e.g. `http://127.0.0.1:54321`. */
  url: string;

  /** Stops the process (SIGINT, then SIGKILL on timeout). */
  stop(): Promise<void>;

  /** Captured stdout lines, for tests that want to assert on log output. */
  stdout: string[];

  /** Captured stderr lines, for tests that want to assert on error output. */
  stderr: string[];
}

export interface StartCliOptions {
  /** Port the embedded Redis is listening on. Passed to the CLI as `--redis-port`. */
  redisPort: number;

  /**
   * CLI flags to pass through. The helper adds `--port <random>` and
   * `--redis-port <redisPort>`; every other flag is the caller's
   * responsibility.
   */
  args: string[];

  /**
   * Timeout for readiness polling, in milliseconds. Defaults to 10s.
   * A slow CI machine with a cold `redis-smq-web-ui` bundle can take
   * a couple of seconds to boot; 10s is comfortable without hiding a
   * genuine hang.
   */
  readyTimeoutMs?: number;
}

/**
 * Resolves the CLI entry point.
 */
function resolveCliPath(): string {
  const here = env.getCurrentDir();
  return resolve(here, '../../src/cli.js');
}

export async function startCli(options: StartCliOptions): Promise<CliProcess> {
  const { redisPort, args, readyTimeoutMs = 10_000 } = options;

  const port = await net.getRandomPort();
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
    {
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

  const stdout: string[] = [];
  const stderr: string[] = [];
  proc.stdout.on('data', (d: unknown) => stdout.push(String(d)));
  proc.stderr.on('data', (d: unknown) => stderr.push(String(d)));

  // Wait for the process to exit for any reason other than "still
  // running". A test that passes an invalid `--port` gets an exit
  // before readiness, and we surface the captured stderr with the
  // real message from `reportStartupError`.
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
      // Any HTTP response means the listener is up. The status code
      // doesn't matter — a 404 or a redirect still proves the server
      // is accepting connections.
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
      // Ask nicely first. The CLI installs a SIGINT handler that
      // calls `server.shutdown()` and exits 130. Give it 500ms to
      // drain; if it hasn't exited by then, kill it. `proc.killed`
      // becomes true after `kill()` is called, even if the signal
      // hasn't been delivered yet, so a second SIGKILL on a dead
      // process would be a no-op — but checking `exitCode` is
      // stricter and gives us the chance to observe a clean shutdown.
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
