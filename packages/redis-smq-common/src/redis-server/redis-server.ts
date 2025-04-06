import { ChildProcess, spawn } from 'child_process';
import { net } from '../net/index.js';
import { PowerSwitch } from '../power-switch/index.js';
import { initializeRedisServer } from './setup-redis.js';

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

  private async ensureRedisBinaryIsInstalled(): Promise<string> {
    if (!this.redisBinaryPath) {
      this.redisBinaryPath = await initializeRedisServer();
    }
    return this.redisBinaryPath;
  }

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

  async start(port?: number): Promise<number> {
    const goingUp = this.powerSwitch.goingUp();
    if (!goingUp) {
      throw new Error('Cannot start Redis server while it is already running.');
    }
    this.redisBinaryPath = await this.ensureRedisBinaryIsInstalled();
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
