[RedisSMQ Common Library](../README.md) / Documentation

# Documentation

The RedisSMQ Common Library consists of the following key components:

1. **EventBus**: Implements a publish-subscribe pattern for event handling, allowing components to communicate through events without direct coupling.
2. **RedisLock**: Provides distributed locking mechanisms using Redis as a centralized lock manager.
3. **RedisServer**: An embedded standalone server for testing and development purposes.
4. **RedisClient**: A wrapper for Redis operations, supporting both node-redis and ioredis clients, providing a unified interface for Redis commands, transactions, and pub/sub operations.
5. **FileLock**: A file-based locking mechanism to ensure exclusive access to a resource in a multiprocess environment.
6. **archive**: A utility for handling archive extraction, supporting both .tgz and .rpm formats.
7. **env**: A utility for accessing environment-related paths, such as the current working directory and cache directory.
8. **net**: Utility functions for network-related tasks, specifically for checking port availability and finding random available ports.
9. **async**: Provides utility functions for asynchronous iteration over arrays and objects, as well as for executing tasks in a waterfall pattern.
10. **Event**: Provides a typed and structured implementation of an event emitter using Node.js's EventEmitter class.
11. **EventBus**: Provides a type-safe event handling and ensures that events can be published and subscribed to across different parts of an application or services.
12. **Errors**: Provides based error classes for specific failure scenarios within the RedisSMQ.
13. **Logger**: A flexible logging system, supporting various log levels and customizable output formats.
14. **PowerSwitch**: Manages the power state of components, providing methods for graceful shutdown and restart of services.
15. **Runnable**: An abstract base class for implementing runnable components, providing lifecycle management (start, stop, pause, resume) for long-running processes.
16. **Worker**: Implements a worker pattern for processing tasks, allowing the creation of specialized workers for different types of jobs.
17. **Timer**: A wrapper around setTimout() and setInterval().

See [API reference](./api/README.md) for more details.

## Guides

To get started with the RedisSMQ Common Library, refer to the following guides:

- [Logger](./logger.md)
- [Redis Client](./redis-client)
- [Redis Server](./redis-server.md)

