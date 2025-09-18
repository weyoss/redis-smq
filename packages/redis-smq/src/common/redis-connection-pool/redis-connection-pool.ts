/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ICallback,
  IRedisClient,
  IRedisConfig,
  EventEmitter,
} from 'redis-smq-common';
import { RedisClient } from '../redis-client/redis-client.js';
import {
  IConnectionPoolConfig,
  IPooledConnection,
  TRedisConnectionPoolEvent,
} from './types/index.js';

/**
 * Redis Connection Pool implementation that manages multiple Redis client instances
 * for improved performance and concurrent operations handling.
 *
 * Features:
 * - Configurable pool size (min/max connections)
 * - Connection lifecycle management
 * - Idle connection cleanup
 * - Connection validation
 * - Graceful shutdown
 * - Event-driven architecture
 *
 * @example
 * ```typescript
 * const poolConfig = {
 *   min: 2,
 *   max: 10,
 *   acquireTimeoutMillis: 5000,
 *   idleTimeoutMillis: 30000
 * };
 *
 * const pool = new RedisConnectionPool(redisConfig, poolConfig);
 *
 * pool.init((err) => {
 *   if (err) {
 *     console.error('Failed to initialize pool:', err);
 *     return;
 *   }
 *
 *   // Acquire a connection
 *   pool.acquire((err, client) => {
 *     if (err) return;
 *
 *     // Use the client
 *     client.get('key', (err, value) => {
 *       // Release the connection back to the pool
 *       pool.release(client);
 *     });
 *   });
 * });
 * ```
 */
export class RedisConnectionPool extends EventEmitter<TRedisConnectionPoolEvent> {
  private static instance: RedisConnectionPool | null = null;

  private readonly redisConfig: IRedisConfig;
  private readonly poolConfig: Required<IConnectionPoolConfig>;
  private readonly connections: Map<string, IPooledConnection> = new Map();
  private readonly waitingQueue: Array<{
    callback: ICallback<IRedisClient>;
    timestamp: number;
  }> = [];

  private initialized = false;
  private shuttingDown = false;
  private reapTimer: NodeJS.Timeout | null = null;
  private connectionIdCounter = 0;

  protected constructor(
    redisConfig: IRedisConfig,
    poolConfig: IConnectionPoolConfig = {},
  ) {
    super();
    this.redisConfig = redisConfig;
    this.poolConfig = {
      min: poolConfig.min ?? 2,
      max: poolConfig.max ?? Infinity,
      acquireTimeoutMillis: poolConfig.acquireTimeoutMillis ?? 5000,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis ?? 30000,
      reapIntervalMillis: poolConfig.reapIntervalMillis ?? 10000,
    };

    // Validate configuration
    if (this.poolConfig.min < 0) {
      throw new Error('Pool min size cannot be negative');
    }
    if (this.poolConfig.max < this.poolConfig.min) {
      throw new Error('Pool max size cannot be less than min size');
    }
  }

  static initialize(
    redisConfig: IRedisConfig,
    poolConfig: IConnectionPoolConfig = {},
  ): RedisConnectionPool {
    if (RedisConnectionPool.instance) {
      throw new Error('RedisConnectionPool already initialized');
    }
    RedisConnectionPool.instance = new RedisConnectionPool(
      redisConfig,
      poolConfig,
    );
    return RedisConnectionPool.instance;
  }

  static getInstance(): RedisConnectionPool {
    if (!RedisConnectionPool.instance) {
      throw new Error(
        'RedisConnectionPool is not initialized. Use initialize() before calling getInstance()',
      );
    }
    return RedisConnectionPool.instance;
  }

  static shutdown(cb: ICallback): void {
    if (RedisConnectionPool.instance) {
      return RedisConnectionPool.instance.shutdown(() => {
        RedisConnectionPool.instance = null;
        cb();
      });
    }
    cb();
  }

  /**
   * Initializes the connection pool by creating the minimum number of connections
   * and starting the idle connection reaper.
   */
  init(cb: ICallback): void {
    if (this.initialized) {
      return cb(new Error('Connection pool already initialized'));
    }

    this.createMinimumConnections((err) => {
      if (err) return cb(err);

      this.initialized = true;
      this.startReaper();
      cb();
    });
  }

  /**
   * Acquires a connection from the pool.
   * If no connections are available and the pool hasn't reached max size,
   * a new connection will be created.
   */
  acquire(cb: ICallback<IRedisClient>): void {
    if (!this.initialized) {
      return cb(new Error('Connection pool not initialized'));
    }

    if (this.shuttingDown) {
      return cb(new Error('Connection pool is shutting down'));
    }

    // Try to find an available connection
    const availableConnection = this.findAvailableConnection();
    if (availableConnection) {
      return this.prepareConnection(availableConnection, cb);
    }

    // No available connections, check if we can create a new one
    if (this.connections.size < this.poolConfig.max) {
      return this.createConnection((err, connection) => {
        if (err) return cb(err);
        if (!connection) return cb(new Error('Failed to create connection'));
        this.prepareConnection(connection, cb);
      });
    }

    // Pool is at max capacity, add to waiting queue
    this.waitingQueue.push({
      callback: cb,
      timestamp: Date.now(),
    });

    // Set timeout for waiting requests
    setTimeout(() => {
      const index = this.waitingQueue.findIndex((item) => item.callback === cb);
      if (index !== -1) {
        this.waitingQueue.splice(index, 1);
        cb(new Error('Connection acquire timeout'));
      }
    }, this.poolConfig.acquireTimeoutMillis);
  }

  /**
   * Releases a connection back to the pool, making it available for reuse.
   */
  release(client: IRedisClient): void {
    const connectionId = this.getConnectionId(client);
    if (!connectionId) {
      this.emit(
        'connectionError',
        new Error('Attempted to release unknown connection'),
      );
      return;
    }

    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.emit('connectionError', new Error('Connection not found in pool'));
      return;
    }

    connection.inUse = false;
    connection.lastUsed = Date.now();
    this.emit('connectionReleased', connection);

    // Process waiting queue
    this.processWaitingQueue();
  }

  /**
   * Gets the current pool statistics.
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    waiting: number;
  } {
    const inUse = Array.from(this.connections.values()).filter(
      (conn) => conn.inUse,
    ).length;
    return {
      total: this.connections.size,
      available: this.connections.size - inUse,
      inUse,
      waiting: this.waitingQueue.length,
    };
  }

  /**
   * Gracefully shuts down the connection pool by closing all connections
   * and clearing timers.
   */
  shutdown(cb: ICallback): void {
    if (this.shuttingDown) {
      return cb(new Error('Connection pool already shutting down'));
    }

    this.shuttingDown = true;
    this.stopReaper();

    // Reject all waiting requests
    while (this.waitingQueue.length > 0) {
      const item = this.waitingQueue.shift();
      if (item) {
        item.callback(new Error('Connection pool shutting down'));
      }
    }

    // Close all connections
    const connectionPromises: Promise<void>[] = [];
    for (const [, connection] of this.connections) {
      connectionPromises.push(
        new Promise<void>((resolve) => {
          connection.client.halt(() => {
            this.emit('connectionDestroyed', connection);
            resolve();
          });
        }),
      );
    }

    Promise.all(connectionPromises)
      .then(() => {
        this.connections.clear();
        this.initialized = false;
        this.shuttingDown = false;
        cb();
      })
      .catch((err: Error) => {
        cb(err);
      });
  }

  private createMinimumConnections(cb: ICallback): void {
    if (this.poolConfig.min === 0) {
      return cb();
    }

    let created = 0;
    let hasError = false;

    const createNext = () => {
      if (hasError || created >= this.poolConfig.min) {
        return cb(
          hasError
            ? new Error('Failed to create minimum connections')
            : undefined,
        );
      }

      this.createConnection((err) => {
        if (err) {
          hasError = true;
          return cb(err);
        }
        created++;
        createNext();
      });
    };

    createNext();
  }

  private createConnection(cb: ICallback<IPooledConnection>): void {
    const redisClient = new RedisClient(this.redisConfig);

    redisClient.init((err) => {
      if (err) return cb(err);

      const clientInstance = redisClient.getInstance();
      if (clientInstance instanceof Error) {
        return cb(clientInstance);
      }

      const connectionId = this.generateConnectionId();
      const connection: IPooledConnection = {
        client: clientInstance,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        inUse: false,
      };

      // Store connection ID on the client for later retrieval
      // @ts-expect-error TS2339: Property __poolConnectionId does not exist on type IRedisClient
      clientInstance.__poolConnectionId = connectionId;

      // Handle client errors
      clientInstance.on('error', (err) => {
        this.handleConnectionError(connectionId, err);
      });

      this.connections.set(connectionId, connection);
      this.emit('connectionCreated', connection);
      cb(null, connection);
    });
  }

  private findAvailableConnection(): IPooledConnection | null {
    for (const connection of this.connections.values()) {
      if (!connection.inUse) {
        return connection;
      }
    }
    return null;
  }

  private prepareConnection(
    connection: IPooledConnection,
    cb: ICallback<IRedisClient>,
  ): void {
    connection.inUse = true;
    connection.lastUsed = Date.now();
    this.emit('connectionAcquired', connection);
    cb(null, connection.client);
  }

  private processWaitingQueue(): void {
    if (this.waitingQueue.length === 0) return;

    const availableConnection = this.findAvailableConnection();
    if (availableConnection) {
      const waitingItem = this.waitingQueue.shift();
      if (waitingItem) {
        this.prepareConnection(availableConnection, waitingItem.callback);
      }
    }
  }

  private startReaper(): void {
    if (this.reapTimer) return;

    this.reapTimer = setInterval(() => {
      this.reapIdleConnections();
    }, this.poolConfig.reapIntervalMillis);
  }

  private stopReaper(): void {
    if (this.reapTimer) {
      clearInterval(this.reapTimer);
      this.reapTimer = null;
    }
  }

  private reapIdleConnections(): void {
    if (this.shuttingDown) return;

    const now = Date.now();
    const connectionsToDestroy: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      if (
        !connection.inUse &&
        this.connections.size > this.poolConfig.min &&
        now - connection.lastUsed > this.poolConfig.idleTimeoutMillis
      ) {
        connectionsToDestroy.push(connectionId);
      }
    }

    connectionsToDestroy.forEach((connectionId) => {
      this.destroyConnection(connectionId);
    });
  }

  private destroyConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.connections.delete(connectionId);
    connection.client.halt(() => {
      this.emit('connectionDestroyed', connection);
    });
  }

  private handleConnectionError(connectionId: string, error: Error): void {
    this.emit('connectionError', error);
    this.destroyConnection(connectionId);

    // If we're below minimum connections, create a new one
    if (this.connections.size < this.poolConfig.min && !this.shuttingDown) {
      this.createConnection((err) => {
        if (err) {
          this.emit(
            'connectionError',
            new Error(`Failed to replace failed connection: ${err.message}`),
          );
        }
      });
    }
  }

  private getConnectionId(client: IRedisClient): string | null {
    // @ts-expect-error TS2339: Property __poolConnectionId does not exist on type IRedisClient
    return client.__poolConnectionId || null;
  }

  private generateConnectionId(): string {
    return `conn_${++this.connectionIdCounter}_${Date.now()}`;
  }
}
