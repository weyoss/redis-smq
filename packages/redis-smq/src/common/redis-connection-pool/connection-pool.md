# Redis Connection Pool

A robust Redis connection pool implementation for RedisSMQ that manages multiple Redis client instances to improve performance and handle concurrent operations efficiently.

## Features

- **Configurable Pool Size**: Set minimum and maximum connection limits
- **Connection Lifecycle Management**: Automatic creation, validation, and cleanup
- **Idle Connection Cleanup**: Automatically removes unused connections after timeout
- **Connection Validation**: Optional connection health checks before use
- **Graceful Shutdown**: Clean resource cleanup on application exit
- **Event-Driven Architecture**: Monitor pool events for debugging and metrics
- **Concurrent Operation Support**: Handle multiple simultaneous Redis operations
- **Error Handling**: Automatic connection replacement on failures

## Basic Usage

```typescript
import { RedisConnectionPool, IConnectionPoolConfig } from './connection-pool.js';
import { ERedisConfigClient } from 'redis-smq-common';

// Redis configuration
const redisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: 'localhost',
    port: 6379,
    db: 0,
  },
};

// Pool configuration
const poolConfig: IConnectionPoolConfig = {
  min: 2,                        // Minimum 2 connections
  max: 10,                       // Maximum 10 connections
  acquireTimeoutMillis: 5000,    // 5 second timeout
  idleTimeoutMillis: 30000,      // Close idle connections after 30 seconds
  reapIntervalMillis: 10000,     // Check for idle connections every 10 seconds
  testOnBorrow: true,            // Validate connections before use
};

// Create and initialize the pool
const pool = new RedisConnectionPool(redisConfig, poolConfig);

pool.init((err) => {
  if (err) {
    console.error('Failed to initialize pool:', err);
    return;
  }

  // Pool is ready to use
  console.log('Connection pool initialized');
});
```

## Acquiring and Releasing Connections

```typescript
// Acquire a connection
pool.acquire((err, client) => {
  if (err) {
    console.error('Failed to acquire connection:', err);
    return;
  }

  // Use the Redis client
  client.set('key', 'value', {}, (setErr) => {
    if (setErr) {
      // Always release the connection, even on error
      pool.release(client);
      return;
    }

    client.get('key', (getErr, value) => {
      // Release the connection back to the pool
      pool.release(client);
      
      if (!getErr) {
        console.log('Retrieved value:', value);
      }
    });
  });
});
```

## Event Monitoring

```typescript
// Monitor pool events
pool.on('error', (err) => {
  console.error('Pool error:', err);
});

pool.on('connectionCreated', (connection) => {
  console.log('New connection created');
});

pool.on('connectionDestroyed', (connection) => {
  console.log('Connection destroyed');
});

pool.on('connectionAcquired', (connection) => {
  console.log('Connection acquired');
});

pool.on('connectionReleased', (connection) => {
  console.log('Connection released');
});
```

## Pool Statistics

```typescript
// Get current pool statistics
const stats = pool.getStats();
console.log('Pool Stats:', {
  total: stats.total,        // Total connections in pool
  available: stats.available, // Available connections
  inUse: stats.inUse,        // Connections currently in use
  waiting: stats.waiting,    // Requests waiting for connections
});
```

## Concurrent Operations

```typescript
// Handle multiple concurrent operations
const operations = [];

for (let i = 0; i < 20; i++) {
  operations.push(
    new Promise((resolve, reject) => {
      pool.acquire((err, client) => {
        if (err) return reject(err);

        // Perform Redis operation
        client.ping((pingErr) => {
          pool.release(client); // Always release
          
          if (pingErr) return reject(pingErr);
          resolve(`Operation ${i} completed`);
        });
      });
    })
  );
}

Promise.all(operations)
  .then(results => console.log('All operations completed'))
  .catch(err => console.error('Operation failed:', err));
```

## Error Handling with Retries

```typescript
function performOperationWithRetry(maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const attempt = () => {
      attempts++;
      
      pool.acquire((err, client) => {
        if (err) {
          if (attempts < maxRetries) {
            setTimeout(attempt, 1000 * attempts); // Exponential backoff
            return;
          }
          return reject(err);
        }

        client.ping((pingErr) => {
          pool.release(client);
          
          if (pingErr && attempts < maxRetries) {
            setTimeout(attempt, 1000 * attempts);
            return;
          }
          
          pingErr ? reject(pingErr) : resolve('Success');
        });
      });
    };

    attempt();
  });
}
```

## Graceful Shutdown

```typescript
// Shutdown the pool when application exits
process.on('SIGTERM', () => {
  pool.shutdown((err) => {
    if (err) {
      console.error('Error during pool shutdown:', err);
      process.exit(1);
    }
    
    console.log('Pool shut down gracefully');
    process.exit(0);
  });
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `min` | number | 2 | Minimum number of connections to maintain |
| `max` | number | 10 | Maximum number of connections allowed |
| `acquireTimeoutMillis` | number | 5000 | Timeout for acquiring connections (ms) |
| `idleTimeoutMillis` | number | 30000 | Time before idle connections are closed (ms) |
| `reapIntervalMillis` | number | 10000 | Interval for checking idle connections (ms) |
| `testOnBorrow` | boolean | true | Validate connections before returning them |

## Best Practices

1. **Always Release Connections**: Ensure connections are released back to the pool, even in error cases
2. **Handle Timeouts**: Set appropriate timeout values based on your application needs
3. **Monitor Pool Stats**: Regularly check pool statistics to optimize configuration
4. **Graceful Shutdown**: Always shut down the pool when your application exits
5. **Error Handling**: Implement proper error handling and retry logic
6. **Pool Sizing**: Size your pool based on expected concurrent operations
7. **Connection Validation**: Enable `testOnBorrow` in production environments

## Integration with RedisSMQ

The connection pool integrates seamlessly with the existing RedisSMQ architecture:

```typescript
import { Configuration } from '../config/index.js';
import { RedisConnectionPool } from './connection-pool.js';

// Use the same Redis configuration as RedisSMQ
const config = Configuration.getConfig();
const pool = new RedisConnectionPool(config.redis, {
  min: 2,
  max: 10,
});

pool.init((err) => {
  if (!err) {
    console.log('Connection pool ready for RedisSMQ operations');
  }
});
```

This connection pool provides a robust foundation for high-performance Redis operations in RedisSMQ applications.