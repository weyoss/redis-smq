[RedisSMQ Common Library](../README.md) / Documentation

# Documentation

## API

For detailed information, refer to the [API reference](api/README.md).

## Guides

Learn how to use specific components of the RedisSMQ Common Library:

- [Using the Logger](./logger.md): A guide on how to effectively use the logging system.
- [Redis Client Usage Guide](./redis.md): Instructions on working with the Redis client.

## Components

The RedisSMQ Common Library consists of several key components that provide essential functionality for Redis-based
messaging and queueing systems:

1. **EventBus**:

   - Implements a publish-subscribe pattern for event handling.
   - Allows components to communicate through events without direct coupling.

2. **Locker**:

   - Provides distributed locking mechanisms.
   - Ensures synchronization in distributed systems using Redis as a centralized lock manager.

3. **RedisClient**:

   - A wrapper for Redis operations.
   - Supports both node-redis and ioredis clients.
   - Provides a unified interface for Redis commands, transactions, and pub/sub operations.

4. **Timer**:

   - Utilities for time-based operations and scheduling.
   - Helps in implementing delayed tasks and periodic jobs.

5. **Logger**:

   - A flexible logging system.
   - Supports various log levels and can be customized for different output formats.

6. **PowerSwitch**:

   - Manages the power state of components.
   - Provides methods for graceful shutdown and restart of services.

7. **Runnable**:

   - An abstract base class for implementing runnable components.
   - Provides lifecycle management (start, stop, pause, resume) for long-running processes.

8. **Worker**:
   - Implements a worker pattern for processing tasks.
   - Can be extended to create specialized workers for different types of jobs.

For more detailed information on each component, including methods and usage examples, please refer to
the [API reference](api/README.md).
