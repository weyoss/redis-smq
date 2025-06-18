/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ChildProcess, spawn } from 'child_process';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { env } from '../env/index.js';
import { net } from '../net/index.js';
import { PowerSwitch } from '../power-switch/index.js';
import { constants } from './constants.js';
import { RedisServerBinaryNotFoundError } from './errors/index.js';

const { REDIS_BINARY_PATH } = constants;
const execAsync = promisify(exec);

export class RedisServer {
  private redisBinaryPath: string | null = null;
  private redisChildProcess: ChildProcess | null = null;
  private redisPort: number | null = null;
  private powerSwitch = new PowerSwitch();
  private static readonly STARTUP_TIMEOUT = 10000;
  private static readonly SHUTDOWN_TIMEOUT = 5000;

  constructor() {
    this.setupGlobalProcessListeners();
  }

  private setupGlobalProcessListeners(): void {
    process.on('SIGINT', this.handleProcessExit);
    process.on('SIGTERM', this.handleProcessExit);
  }

  private handleProcessExit = async (): Promise<void> => {
    await this.shutdown();
  };

  private async waitForRedisServerStartup(): Promise<number> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanUp();
        reject(new Error('Redis server start timeout'));
      }, RedisServer.STARTUP_TIMEOUT);

      const onData = (data: Buffer) => {
        if (data.toString().includes('Ready to accept connections')) {
          cleanUp();
          resolve(Number(this.redisPort));
        }
      };

      const onError = (error: Error) => {
        cleanUp();
        reject(error);
      };

      const onExit = (code: number) => {
        cleanUp();
        reject(new Error(`Redis server exited with code ${code}`));
      };

      this.redisChildProcess?.stdout?.on('data', onData);
      this.redisChildProcess?.on('error', onError);
      this.redisChildProcess?.on('exit', onExit);

      const cleanUp = () => {
        clearTimeout(timeout);
        this.redisChildProcess?.stdout?.removeListener('data', onData);
        this.redisChildProcess?.removeListener('error', onError);
        this.redisChildProcess?.removeListener('exit', onExit);
      };
    });
  }

  private setupChildProcessListeners(): void {
    this.redisChildProcess?.stderr?.on('data', (data: Buffer): void => {
      console.error(
        `Redis stderr (${this.redisPort}): ${data.toString().trim()}`,
      );
    });
    this.redisChildProcess?.on('error', () => this.shutdown());
    this.redisChildProcess?.on('exit', () => this.shutdown());
  }

  /**
   * Retrieves the system-wide Redis binary path.
   *
   * @returns {Promise<string | null>} - The path to the system-wide Redis binary, or null if not found.
   */
  private async fetchSystemWideRedisBinaryPath(): Promise<string | null> {
    try {
      const { stdout } = await execAsync(
        'which redis-server || where redis-server',
      );
      return stdout.trim() || null;
    } catch {
      return null;
    }
  }

  private async getRedisServerBinaryPath(): Promise<string | null> {
    const systemWideBinaryPath = await this.fetchSystemWideRedisBinaryPath();
    if (systemWideBinaryPath) return systemWideBinaryPath;
    if (await env.doesPathExist(REDIS_BINARY_PATH)) {
      return REDIS_BINARY_PATH;
    }
    return null;
  }

  async start(port?: number): Promise<number> {
    const goingUp = this.powerSwitch.goingUp();
    if (!goingUp) {
      throw new Error('Cannot start Redis server while it is already running.');
    }

    this.redisBinaryPath = await this.getRedisServerBinaryPath();
    if (!this.redisBinaryPath) {
      throw new RedisServerBinaryNotFoundError();
    }

    this.redisPort = port ?? (await net.getRandomPort());

    this.redisChildProcess = spawn(this.redisBinaryPath, [
      '--appendonly',
      'no',
      '--save',
      '',
      '--port',
      this.redisPort.toString(),
    ]);
    this.setupChildProcessListeners();

    await this.waitForRedisServerStartup();
    this.powerSwitch.commit();
    return this.redisPort;
  }

  async shutdown(): Promise<void> {
    const goingDown = this.powerSwitch.goingDown();
    if (!goingDown) return;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.redisChildProcess?.kill('SIGKILL');
        reject(new Error('Redis server did not shut down gracefully.'));
      }, RedisServer.SHUTDOWN_TIMEOUT);

      const cleanUp = () => {
        clearTimeout(timeout);
        this.redisChildProcess = null;
        this.redisPort = null;
        resolve();
      };

      this.redisChildProcess?.once('close', cleanUp);
      this.redisChildProcess?.kill('SIGTERM');
    });
    this.powerSwitch.commit();
  }
}
