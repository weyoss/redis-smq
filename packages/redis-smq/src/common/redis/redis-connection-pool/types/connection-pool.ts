/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisClient } from 'redis-smq-common';

export interface IConnectionPoolConfig {
  /**
   * Minimum number of connections to maintain in the pool
   * @default 2
   */
  min?: number;

  /**
   * Maximum number of connections allowed in the pool
   * @default Infinity
   */
  max?: number;

  /**
   * Maximum time in milliseconds to wait for a connection
   * @default 5000
   */
  acquireTimeoutMillis?: number;

  /**
   * Time in milliseconds after which idle connections are destroyed
   * @default 30000
   */
  idleTimeoutMillis?: number;

  /**
   * Interval in milliseconds to check for idle connections
   * @default 10000
   */
  reapIntervalMillis?: number;
}

/**
 * Enumeration for connection acquisition modes.
 */
export enum ERedisConnectionAcquisitionMode {
  // Exclusive mode - connection is locked to a single user until released
  EXCLUSIVE = 'exclusive',
  // Shared mode - connection can be used by multiple users simultaneously
  SHARED = 'shared',
}

export interface IRedisPooledConnection {
  client: IRedisClient;
  createdAt: number;
  lastUsed: number;
  inUse: boolean;
  sharedUsers: number;
  exclusivelyAcquired: boolean;
  acquisitionMode: ERedisConnectionAcquisitionMode;
}

export type TRedisConnectionPoolEvent = {
  connectionError: (err: Error) => void;
  connectionCreated: (connection: IRedisPooledConnection) => void;
  connectionDestroyed: (connection: IRedisPooledConnection) => void;
  connectionAcquired: (connection: IRedisPooledConnection) => void;
  connectionReleased: (connection: IRedisPooledConnection) => void;
};
