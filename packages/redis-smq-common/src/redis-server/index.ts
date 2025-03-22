/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { spawn, ChildProcess, exec } from 'child_process';
import { promisify } from 'node:util';
import { net } from '../net/index.js';

const execPromise = promisify(exec);
const PROCESS_MAP = new Map<number, ChildProcess>();

async function getRedisBinPath(): Promise<string | null> {
  try {
    const { stdout } = await execPromise(
      'which redis-server || where redis-server',
    );
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

function handleExit() {
  return async () => {
    await redisServer.cleanUp();
    process.exit(0);
  };
}

export const redisServer = {
  /**
   * Starts a Redis server in a child process.
   *
   * @param {number} [redisPort] - Optional port number to start the Redis server on. If not provided, a random port will be chosen.
   * @returns {Promise<number>} - A promise that resolves with the port number the Redis server is running on.
   * @throws {Error} - Will throw an error if the Redis binary is not found or if the Redis server fails to start.
   *
   * @remarks
   * This function spawns a child process to run the Redis server with the specified options.
   * It listens for the 'Ready to accept connections' message in the stdout to determine when the server is ready.
   * If the server does not start within 10 seconds, it will be terminated and an error will be thrown.
   * The spawned process is added to a map for later cleanup.
   *
   * @example
   * ```javascript
   * const redisPort = await startRedisServer();
   * console.log(`Redis server started on port ${redisPort}`);
   * ```
   */
  async startRedisServer(redisPort?: number): Promise<number> {
    const redisBinPath = await getRedisBinPath();
    if (!redisBinPath) {
      throw new Error('Redis binary not found.');
    }
    const port = redisPort ?? (await net.getRandomPort());
    if (PROCESS_MAP.has(port)) {
      throw new Error(`Redis server is already running on port ${port}.`);
    }
    const process = spawn(redisBinPath, [
      '--appendonly',
      'no',
      '--save',
      '',
      '--port',
      port.toString(),
    ]);
    PROCESS_MAP.set(port, process);
    process.stderr.on('data', (data: Buffer) => {
      console.error(`Redis stderr (${port}): ${data.toString().trim()}`);
    });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Redis server start timeout'));
      }, 10000);

      const cleanup = () => {
        clearTimeout(timeout);
        process.stdout.removeListener('data', dataListener);
        process.removeListener('error', errorListener);
        process.removeListener('exit', exitListener);
      };

      const dataListener = (data: Buffer) => {
        if (data.toString().includes('Ready to accept connections')) {
          cleanup();
          resolve(port);
        }
      };
      const errorListener = (error: Error) => {
        cleanup();
        PROCESS_MAP.delete(port);
        reject(error);
      };
      const exitListener = (code: number) => {
        cleanup();
        PROCESS_MAP.delete(port);
        reject(new Error(`Redis server exited with code ${code}`));
      };
      process.stdout.on('data', dataListener);
      process.on('error', errorListener);
      process.on('exit', exitListener);
    });
  },

  /**
   * Shuts down a Redis server process running in a child process.
   *
   * @param {number} port - The port number on which the Redis server is running.
   * @returns {Promise<void>} - A promise that resolves when the Redis server is successfully shut down.
   *
   * @remarks
   * This function attempts to gracefully shut down the Redis server process by sending a SIGTERM signal.
   * If the server does not shut down within 5 seconds, it will be forcefully terminated using SIGKILL.
   * The function removes the process from the PROCESS_MAP after successful shutdown.
   *
   * @example
   * ```javascript
   * const redisPort = 6379;
   * await shutdownRedisServer(redisPort);
   * console.log(`Redis server at port ${redisPort} has been shut down.`);
   * ```
   */
  async shutdownRedisServer(port: number): Promise<void> {
    const process = PROCESS_MAP.get(port);
    if (!process) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        process.kill('SIGKILL');
        reject(
          new Error(
            `Redis server at port ${port} did not shut down gracefully.`,
          ),
        );
      }, 5000);
      const cleanup = () => {
        clearTimeout(timeout);
        PROCESS_MAP.delete(port);
        resolve();
      };
      process.once('close', cleanup);
      process.kill('SIGTERM');
    });
  },

  /**
   * Cleans up and shuts down all Redis server processes running in child processes.
   *
   * @returns {Promise<void>} - A promise that resolves when all Redis server processes have been successfully shut down.
   *
   * @remarks
   * This function iterates through the `PROCESS_MAP` and calls the `shutdownRedisServer` function for each running process.
   * It awaits the completion of all shutdown operations using `Promise.all`.
   *
   * @example
   * ```javascript
   * await cleanUp();
   * console.log('All Redis server processes have been shut down.');
   * ```
   */
  async cleanUp(): Promise<void> {
    await Promise.all(
      Array.from(PROCESS_MAP.keys()).map(this.shutdownRedisServer),
    );
  },
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
