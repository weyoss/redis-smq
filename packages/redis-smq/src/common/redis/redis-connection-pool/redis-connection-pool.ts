/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EventEmitter,
  ICallback,
  IRedisClient,
  IRedisConfig,
} from 'redis-smq-common';
import { RedisClient } from '../redis-client/redis-client.js';
import {
  ERedisConnectionAcquisitionMode,
  IConnectionPoolConfig,
  IRedisPooledConnection,
  TRedisConnectionPoolEvent,
} from './types/connection-pool.js';

/**
 * Redis Connection Pool implementation that manages multiple Redis client instances
 * for improved performance and concurrent operations handling.
 *
 * This class implements a sophisticated connection pooling mechanism with support for:
 * - Configurable pool size constraints (minimum and maximum connections)
 * - Intelligent connection lifecycle management with automatic creation and cleanup
 * - Idle connection reaping to optimize resource usage
 * - Graceful shutdown with proper resource cleanup
 * - Event-driven architecture for monitoring and debugging
 * - Dual acquisition modes: exclusive (single-user) and shared (multi-user) connections
 * - Queue management for connection requests when pool is at capacity
 * - Automatic minimum connection maintenance during failures and destruction
 *
 * @example Basic Usage
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
 *   console.log('Pool initialized successfully');
 * });
 * ```
 *
 * @example Exclusive Connection Usage
 * ```typescript
 * // Acquire an exclusive connection (locked to single user)
 * pool.acquire(ERedisConnectionAcquisitionMode.EXCLUSIVE, (err, client) => {
 *   if (err) {
 *     console.error('Failed to acquire connection:', err);
 *     return;
 *   }
 *
 *   // Use the client exclusively - no other operations can use this connection
 *   client.get('key', (err, value) => {
 *     if (err) console.error('Redis operation failed:', err);
 *
 *     // MUST release exclusive connections when done
 *     pool.release(client);
 *   });
 * });
 * ```
 *
 * @example Shared Connection Usage
 * ```typescript
 * // Acquire a shared connection (can be used by multiple operations)
 * pool.acquire(ERedisConnectionAcquisitionMode.SHARED, (err, client) => {
 *   if (err) {
 *     console.error('Failed to acquire connection:', err);
 *     return;
 *   }
 *
 *   // Use the client (can be shared with other operations)
 *   client.get('key', (err, value) => {
 *     if (err) console.error('Redis operation failed:', err);
 *
 *     // Optional: release shared connections to help with cleanup
 *     // Connection will be automatically managed if not explicitly released
 *     pool.release(client);
 *   });
 * });
 * ```
 *
 * @example Event Monitoring
 * ```typescript
 * pool.on('connectionCreated', (connection) => {
 *   console.log('New connection created:', connection.createdAt);
 * });
 *
 * pool.on('connectionError', (err) => {
 *   console.error('Connection error occurred:', err);
 * });
 *
 * pool.on('connectionDestroyed', (connection) => {
 *   console.log('Connection destroyed after', Date.now() - connection.createdAt, 'ms');
 * });
 * ```
 */
export class RedisConnectionPool extends EventEmitter<TRedisConnectionPoolEvent> {
  /** Singleton instance of the connection pool */
  protected static instance: RedisConnectionPool | null = null;

  /** Redis client configuration used for creating new connections */
  protected readonly redisConfig: IRedisConfig;

  /** Complete pool configuration with defaults applied */
  protected readonly poolConfig: Required<IConnectionPoolConfig>;

  /** Map of active connections indexed by unique connection ID */
  protected readonly connections: Map<string, IRedisPooledConnection> =
    new Map();

  /** Queue of pending connection requests when pool is at capacity */
  protected readonly waitingQueue: Array<{
    callback: ICallback<IRedisClient>;
    timestamp: number;
    mode: ERedisConnectionAcquisitionMode;
  }> = [];

  /** Flag indicating if the pool has been properly initialized */
  protected initialized = false;

  /** Flag indicating if the pool is in the process of shutting down */
  protected shuttingDown = false;

  /** Timer handle for the idle connection reaper process */
  protected reapTimer: NodeJS.Timeout | null = null;

  /** Counter for generating unique connection identifiers */
  protected connectionIdCounter = 0;

  /**
   * Creates a new Redis Connection Pool instance.
   *
   * @param redisConfig - Configuration for Redis client connections
   * @param poolConfig - Optional pool-specific configuration settings
   *
   * @throws Error When pool min size is negative
   * @throws Error When pool max size is less than min size
   *
   * @example
   * ```typescript
   * const pool = new RedisConnectionPool(
   *   { client: ERedisConfigClient.IOREDIS, options: { host: 'localhost' } },
   *   { min: 2, max: 10, acquireTimeoutMillis: 5000 }
   * );
   * ```
   */
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

  /**
   * Initializes the singleton connection pool instance.
   *
   * This method creates the pool, establishes minimum required connections,
   * starts the idle connection reaper, and sets up the singleton instance.
   *
   * @param redisConfig - Redis client configuration for all pool connections
   * @param poolConfig - Optional pool configuration with size limits and timeouts
   * @param cb - Callback function invoked when initialization completes or fails
   *
   * @throws Error If the pool is already initialized
   *
   * @example
   * ```typescript
   * RedisConnectionPool.initialize(
   *   { client: ERedisConfigClient.IOREDIS },
   *   { min: 3, max: 15 },
   *   (err, pool) => {
   *     if (err) {
   *       console.error('Pool initialization failed:', err);
   *       return;
   *     }
   *     console.log('Pool ready with', pool.getStats().total, 'connections');
   *   }
   * );
   * ```
   */
  static initialize(
    redisConfig: IRedisConfig,
    poolConfig: IConnectionPoolConfig = {},
    cb: ICallback<RedisConnectionPool>,
  ): void {
    if (RedisConnectionPool.instance) {
      throw new Error('RedisConnectionPool already initialized');
    }
    const instance = new RedisConnectionPool(redisConfig, poolConfig);
    instance.createMinimumConnections((err) => {
      if (err) return cb(err);

      instance.initialized = true;
      instance.startReaper();
      RedisConnectionPool.instance = instance;
      cb(null, instance);
    });
  }

  /**
   * Retrieves the singleton connection pool instance.
   *
   * @returns The initialized connection pool instance
   *
   * @throws Error If the pool has not been initialized via initialize()
   *
   * @example
   * ```typescript
   * try {
   *   const pool = RedisConnectionPool.getInstance();
   *   pool.acquire(ERedisConnectionAcquisitionMode.SHARED, (err, client) => {
   *     // Use the client
   *   });
   * } catch (err) {
   *   console.error('Pool not initialized:', err.message);
   * }
   * ```
   */
  static getInstance(): RedisConnectionPool {
    if (!RedisConnectionPool.instance) {
      throw new Error(
        'RedisConnectionPool is not initialized. Use initialize() before calling getInstance()',
      );
    }
    return RedisConnectionPool.instance;
  }

  /**
   * Gracefully shuts down the singleton connection pool instance.
   *
   * This method stops the reaper timer, rejects pending requests, closes all connections,
   * and cleans up the singleton instance reference.
   *
   * @param cb - Callback function invoked when shutdown completes
   *
   * @example
   * ```typescript
   * RedisConnectionPool.shutdown((err) => {
   *   if (err) {
   *     console.error('Shutdown failed:', err);
   *   } else {
   *     console.log('Pool shutdown completed successfully');
   *   }
   * });
   * ```
   */
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
   * Releases an exclusively acquired connection back to the pool.
   *
   * Marks the connection as available and processes any waiting requests.
   *
   * @param connection - The pooled connection to release
   */
  protected releaseExclusiveConnection(
    connection: IRedisPooledConnection,
  ): void {
    connection.inUse = false;
    connection.exclusivelyAcquired = false;
    connection.acquisitionMode = ERedisConnectionAcquisitionMode.EXCLUSIVE;
    connection.lastUsed = Date.now();
    this.emit('connectionReleased', connection);

    // Process waiting queue
    this.processWaitingQueue();
  }

  /**
   * Releases a shared connection by decrementing its usage count.
   *
   * The connection becomes available for cleanup when no shared users remain.
   * Processes waiting queue when connection becomes fully available.
   *
   * @param connection - The pooled connection to release
   */
  protected releaseSharedConnection(connection: IRedisPooledConnection): void {
    if (connection.sharedUsers > 0) {
      connection.sharedUsers--;
      connection.lastUsed = Date.now();

      // If no more shared users, mark as not in use
      if (connection.sharedUsers === 0) {
        connection.inUse = false;
        this.emit('connectionReleased', connection);
        this.processWaitingQueue();
      }
    }
  }

  /**
   * Creates the minimum required number of connections during pool initialization.
   *
   * @param cb - Callback function invoked when minimum connections are created or creation fails
   */
  protected createMinimumConnections(cb: ICallback): void {
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

  /**
   * Creates a new Redis connection and adds it to the pool.
   *
   * This method:
   * 1. Instantiates a new RedisClient with the pool's configuration
   * 2. Initializes the client connection
   * 3. Creates a pooled connection wrapper with metadata
   * 4. Sets up error handling for the connection
   * 5. Adds the connection to the pool
   *
   * @param cb - Callback function invoked with the new connection or creation error
   */
  protected createConnection(cb: ICallback<IRedisPooledConnection>): void {
    const redisClient = new RedisClient(this.redisConfig);

    redisClient.init((err) => {
      if (err) return cb(err);

      const clientInstance = redisClient.getInstance();
      const connectionId = this.generateConnectionId();
      const connection: IRedisPooledConnection = {
        client: clientInstance,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        inUse: false,
        sharedUsers: 0,
        exclusivelyAcquired: false,
        acquisitionMode: ERedisConnectionAcquisitionMode.EXCLUSIVE,
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

  /**
   * Finds an available connection that matches the requested acquisition mode.
   *
   * @param mode - The desired acquisition mode for the connection
   * @returns Available connection matching the mode, or null if none found
   */
  protected findAvailableConnection(
    mode: ERedisConnectionAcquisitionMode,
  ): IRedisPooledConnection | null {
    for (const connection of this.connections.values()) {
      if (mode === ERedisConnectionAcquisitionMode.EXCLUSIVE) {
        // For exclusive mode, connection must not be in use at all
        if (!connection.inUse) {
          return connection;
        }
      } else if (mode === ERedisConnectionAcquisitionMode.SHARED) {
        // For shared mode, connection can be used if not exclusively acquired
        if (!connection.exclusivelyAcquired) {
          return connection;
        }
      }
    }
    return null;
  }

  /**
   * Prepares a connection for use by setting appropriate metadata and usage tracking.
   *
   * @param connection - The pooled connection to prepare
   * @param mode - The acquisition mode for this usage
   * @param cb - Callback function invoked with the prepared client
   */
  protected prepareConnection(
    connection: IRedisPooledConnection,
    mode: ERedisConnectionAcquisitionMode,
    cb: ICallback<IRedisClient>,
  ): void {
    connection.lastUsed = Date.now();
    connection.acquisitionMode = mode;

    if (mode === ERedisConnectionAcquisitionMode.EXCLUSIVE) {
      connection.inUse = true;
      connection.exclusivelyAcquired = true;
      connection.sharedUsers = 0;
    } else {
      connection.inUse = true;
      connection.exclusivelyAcquired = false;
      connection.sharedUsers++;
    }

    this.emit('connectionAcquired', connection);
    cb(null, connection.client);
  }

  /**
   * Processes the waiting queue by attempting to fulfill pending connection requests.
   *
   * Uses FIFO ordering to maintain fairness among waiting requests.
   */
  protected processWaitingQueue(): void {
    if (this.waitingQueue.length === 0) return;

    // Process waiting queue in FIFO order
    for (let i = 0; i < this.waitingQueue.length; i++) {
      const waitingItem = this.waitingQueue[i];
      const availableConnection = this.findAvailableConnection(
        waitingItem.mode,
      );

      if (availableConnection) {
        // Remove from queue and prepare connection
        this.waitingQueue.splice(i, 1);
        this.prepareConnection(
          availableConnection,
          waitingItem.mode,
          waitingItem.callback,
        );
        break; // Process one at a time to maintain fairness
      }
    }
  }

  /**
   * Starts the idle connection reaper timer.
   *
   * The reaper periodically checks for and removes idle connections
   * that exceed the configured idle timeout.
   */
  protected startReaper(): void {
    if (this.reapTimer) return;

    this.reapTimer = setInterval(() => {
      this.reapIdleConnections();
    }, this.poolConfig.reapIntervalMillis);
  }

  /**
   * Stops the idle connection reaper timer.
   */
  protected stopReaper(): void {
    if (this.reapTimer) {
      clearInterval(this.reapTimer);
      this.reapTimer = null;
    }
  }

  /**
   * Identifies and destroys idle connections that exceed the configured timeout.
   *
   * Only destroys connections when the pool size is above the minimum threshold.
   */
  protected reapIdleConnections(): void {
    if (this.shuttingDown) return;

    const now = Date.now();
    const connectionsToDestroy: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      const isIdle =
        !connection.inUse &&
        !connection.exclusivelyAcquired &&
        connection.sharedUsers === 0;

      if (
        isIdle &&
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

  /**
   * Destroys a specific connection by ID, removing it from the pool and closing the client.
   *
   * @param connectionId - Unique identifier of the connection to destroy
   */
  protected destroyConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    this.connections.delete(connectionId);
    connection.client.halt(() => {
      this.emit('connectionDestroyed', connection);
    });
  }

  /**
   * Handles connection errors by emitting events and replacing failed connections.
   *
   * Automatically creates replacement connections if the pool falls below minimum size.
   *
   * @param connectionId - ID of the connection that encountered an error
   * @param error - The error that occurred on the connection
   */
  protected handleConnectionError(connectionId: string, error: Error): void {
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

  /**
   * Retrieves the pooled connection wrapper for a given Redis client.
   *
   * @param client - The Redis client to look up
   * @returns The pooled connection wrapper, or undefined if not found
   */
  protected getConnection(
    client: IRedisClient,
  ): IRedisPooledConnection | undefined {
    const connectionId = this.getConnectionId(client);
    if (!connectionId) {
      this.emit(
        'connectionError',
        new Error('Attempted to retrieve unknown connection'),
      );
      return;
    }
    const connection = this.connections.get(connectionId);
    if (!connection) {
      this.emit('connectionError', new Error('Connection not found in pool'));
    }
    return connection;
  }

  /**
   * Extracts the connection ID from a Redis client instance.
   *
   * @param client - The Redis client containing the connection ID
   * @returns The connection ID, or null if not found
   */
  protected getConnectionId(client: IRedisClient): string | null {
    // @ts-expect-error TS2339: Property __poolConnectionId does not exist on type IRedisClient
    return client.__poolConnectionId || null;
  }

  /**
   * Generates a unique connection identifier.
   *
   * @returns A unique string identifier for a new connection
   */
  protected generateConnectionId(): string {
    return `conn_${++this.connectionIdCounter}_${Date.now()}`;
  }

  /**
   * Acquires a connection from the pool with the specified acquisition mode.
   *
   * This method attempts to find an available connection matching the requested mode.
   * If no connection is available, it will create a new one (if under max limit) or
   * queue the request with a timeout.
   *
   * @param mode - The acquisition mode determining connection sharing behavior
   * @param cb - Callback function invoked with the acquired connection or error
   *
   * @example Exclusive Mode
   * ```typescript
   * // Exclusive acquisition - connection is locked until released
   * pool.acquire(ERedisConnectionAcquisitionMode.EXCLUSIVE, (err, client) => {
   *   if (err) {
   *     console.error('Failed to acquire exclusive connection:', err);
   *     return;
   *   }
   *
   *   // Connection is exclusively yours - no other operations can use it
   *   client.multi()
   *     .set('key1', 'value1')
   *     .set('key2', 'value2')
   *     .exec((err, results) => {
   *       pool.release(client); // Must release when done
   *     });
   * });
   * ```
   *
   * @example Shared Mode
   * ```typescript
   * // Shared acquisition - connection can be used by multiple clients
   * pool.acquire(ERedisConnectionAcquisitionMode.SHARED, (err, client) => {
   *   if (err) {
   *     console.error('Failed to acquire shared connection:', err);
   *     return;
   *   }
   *
   *   // Connection may be shared with other operations
   *   client.get('user:123', (err, userData) => {
   *     pool.release(client); // Optional but recommended
   *   });
   * });
   * ```
   */
  acquire(
    mode: ERedisConnectionAcquisitionMode,
    cb: ICallback<IRedisClient>,
  ): void {
    if (!this.initialized) {
      return cb(new Error('Connection pool not initialized'));
    }

    if (this.shuttingDown) {
      return cb(new Error('Connection pool is shutting down'));
    }

    // Try to find an available connection based on mode
    const availableConnection = this.findAvailableConnection(mode);
    if (availableConnection) {
      return this.prepareConnection(availableConnection, mode, cb);
    }

    // No available connections, check if we can create a new one
    if (this.connections.size < this.poolConfig.max) {
      return this.createConnection((err, connection) => {
        if (err) return cb(err);
        if (!connection) return cb(new Error('Failed to create connection'));
        this.prepareConnection(connection, mode, cb);
      });
    }

    // Pool is at max capacity, add to waiting queue
    this.waitingQueue.push({
      callback: cb,
      timestamp: Date.now(),
      mode,
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
   * Releases an acquired connection back to the pool for reuse.
   *
   * The behavior depends on how the connection was acquired:
   * - Exclusive connections: Immediately become available for any mode
   * - Shared connections: Usage count is decremented, becomes available when count reaches zero
   *
   * @param client - The Redis client connection to release back to the pool
   *
   * @example Releasing Exclusive Connection
   * ```typescript
   * pool.acquire(ERedisConnectionAcquisitionMode.EXCLUSIVE, (err, client) => {
   *   if (err) return;
   *
   *   client.set('key', 'value', (err) => {
   *     // Must release exclusive connections
   *     pool.release(client);
   *   });
   * });
   * ```
   *
   * @example Releasing Shared Connection
   * ```typescript
   * pool.acquire(ERedisConnectionAcquisitionMode.SHARED, (err, client) => {
   *   if (err) return;
   *
   *   client.get('key', (err, value) => {
   *     // Optional for shared connections, but recommended
   *     pool.release(client);
   *   });
   * });
   * ```
   */
  release(client: IRedisClient): void {
    const connection = this.getConnection(client);
    if (!connection) return;

    if (connection.exclusivelyAcquired) {
      return this.releaseExclusiveConnection(connection);
    }

    this.releaseSharedConnection(connection);
  }

  /**
   * Destroys a specific connection and ensures minimum pool size is maintained.
   *
   * This method forcibly removes a connection from the pool and creates replacement
   * connections if necessary to maintain the configured minimum pool size.
   *
   * @param client - The Redis client connection to destroy
   * @param cb - Callback function invoked when destruction is complete
   *
   * @example
   * ```typescript
   * // Destroy a problematic connection
   * pool.destroy(client, (err) => {
   *   if (err) {
   *     console.error('Failed to destroy connection:', err);
   *   } else {
   *     console.log('Connection destroyed, pool rebalanced');
   *   }
   * });
   * ```
   */
  destroy(client: IRedisClient, cb: ICallback): void {
    const connectionId = this.getConnectionId(client);
    if (!connectionId)
      return cb(new Error('Attempted to destroy unknown connection'));

    this.destroyConnection(connectionId);

    // Check if we need to maintain minimum pool size
    const currentPoolSize = this.connections.size;
    const minConnections = this.poolConfig.min;

    if (currentPoolSize < minConnections) {
      const connectionsToCreate = minConnections - currentPoolSize;

      // Create new connections to maintain minimum pool size
      for (let i = 0; i < connectionsToCreate; i++) {
        this.createConnection((err) => {
          if (err) {
            // Log error but don't fail the destroy operation
            this.emit('connectionError', err);
          }
        });
      }
    }

    cb();
  }

  /**
   * Retrieves comprehensive statistics about the current pool state.
   *
   * Provides detailed information about connection usage patterns, including
   * shared connection metrics and queue status.
   *
   * @returns Detailed statistics object with connection counts and usage information
   *
   * @example
   * ```typescript
   * const stats = pool.getStats();
   * console.log(`Pool Status:
   *   Total Connections: ${stats.total}
   *   Available: ${stats.available}
   *   In Use: ${stats.inUse}
   *   Exclusively Acquired: ${stats.exclusively}
   *   Shared Connections: ${stats.shared}
   *   Total Shared Users: ${stats.sharedUsers}
   *   Waiting Requests: ${stats.waiting}
   * `);
   * ```
   */
  getStats(): {
    total: number;
    available: number;
    inUse: number;
    exclusively: number;
    shared: number;
    sharedUsers: number;
    waiting: number;
  } {
    let exclusively = 0;
    let shared = 0;
    let sharedUsers = 0;
    let inUse = 0;

    for (const connection of this.connections.values()) {
      if (connection.exclusivelyAcquired) {
        exclusively++;
        inUse++;
      } else if (connection.sharedUsers > 0) {
        shared++;
        sharedUsers += connection.sharedUsers;
        inUse++;
      }
    }

    return {
      total: this.connections.size,
      available: this.connections.size - inUse,
      inUse,
      exclusively,
      shared,
      sharedUsers,
      waiting: this.waitingQueue.length,
    };
  }

  /**
   * Gracefully shuts down the connection pool by closing all connections and clearing resources.
   *
   * This method:
   * 1. Sets the shutting down flag to prevent new acquisitions
   * 2. Stops the idle connection reaper
   * 3. Rejects all pending connection requests
   * 4. Closes all active connections gracefully
   * 5. Clears internal state
   *
   * @param cb - Callback function invoked when shutdown is complete or fails
   *
   * @example
   * ```typescript
   * pool.shutdown((err) => {
   *   if (err) {
   *     console.error('Pool shutdown encountered errors:', err);
   *   } else {
   *     console.log('Pool shutdown completed successfully');
   *   }
   * });
   * ```
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
}
