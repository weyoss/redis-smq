/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import {
  RedisServerBinaryNotFoundError,
  RedisServerStartupFailedError,
} from './errors/index.js';

const { REDIS_BINARY_PATH } = constants;
const execAsync = promisify(exec);

export class RedisServer {
  private process: ChildProcess | null = null;
  private port: number | null = null;
  private powerSwitch = new PowerSwitch();

  constructor() {
    this.bindExitHandler();
  }

  private bindExitHandler(): void {
    process.once('beforeExit', () => this.shutdown());
  }

  private async findRedisBinary(): Promise<string> {
    try {
      const command =
        process.platform === 'win32'
          ? 'where redis-server'
          : 'which redis-server';
      const { stdout } = await execAsync(command);
      const path = stdout.trim();
      if (path) return path;
    } catch {
      // Continue to bundled Redis
    }

    if (await env.doesPathExist(REDIS_BINARY_PATH)) {
      return REDIS_BINARY_PATH;
    }

    throw new RedisServerBinaryNotFoundError();
  }

  private createRedisArgs(port: number): string[] {
    return ['--port', port.toString(), '--save', '', '--appendonly', 'no'];
  }

  private waitForReady(timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(new Error('Redis process not started'));
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        reject(
          new RedisServerStartupFailedError({
            message: `Redis server start timeout after ${timeoutMs}ms`,
          }),
        );
      }, timeoutMs);

      const onData = (data: Buffer) => {
        if (data.toString().includes('Ready to accept connections')) {
          cleanup();
          resolve();
        }
      };

      const onExit = () => {
        cleanup();
        // Don't reject - just let the Promise hang since process is gone
        // The caller will handle this through abort logic
      };

      const onError = (error: Error) => {
        cleanup();
        reject(
          new RedisServerStartupFailedError({
            message: `Redis process error: ${error.message}`,
          }),
        );
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.process?.stdout?.removeListener('data', onData);
        this.process?.removeListener('exit', onExit);
        this.process?.removeListener('error', onError);
      };

      this.process.stdout?.on('data', onData);
      this.process.on('exit', onExit);
      this.process.on('error', onError);
    });
  }

  private waitForShutdown(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        cleanup();
        this.process?.kill('SIGKILL');
        resolve();
      }, timeoutMs);

      const onExit = () => {
        cleanup();
        resolve();
      };

      const cleanup = () => {
        clearTimeout(timeout);
        this.process?.removeListener('exit', onExit);
      };

      this.process.once('exit', onExit);
      this.process.kill('SIGTERM');
    });
  }

  async start(requestedPort?: number): Promise<number> {
    if (!this.powerSwitch.goingUp()) {
      throw new Error('Already started or going up');
    }

    const redisBinary = await this.findRedisBinary();
    this.port = requestedPort || (await net.getRandomPort());

    this.process = spawn(redisBinary, this.createRedisArgs(this.port));

    try {
      await this.waitForReady(10000);
    } catch (error: unknown) {
      // Check if process is still alive
      if (this.process && !this.process.exitCode && !this.process.killed) {
        // Process is still running but timed out or errored
        throw error;
      }

      // Process was killed externally or during shutdown
      // Don't throw an error, just return the port we attempted to use
      return this.port;
    }

    this.powerSwitch.commit();
    return this.port;
  }

  async shutdown(): Promise<void> {
    if (!this.powerSwitch.goingDown()) return;

    try {
      if (this.process) {
        await this.waitForShutdown(5000);
      }
    } finally {
      this.process = null;
      this.port = null;
      this.powerSwitch.commit();
    }
  }
}
