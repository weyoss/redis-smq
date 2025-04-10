[RedisSMQ Common Library](../README.md) / Redis Server

# Redis Server

The `RedisServer` class is a lightweight utility for managing Redis server instances. It provides a simple way to start 
and stop Redis server processes programmatically.

This utility is designed for:
- Testing environments requiring isolated Redis instances
- Local development setups

The `RedisServer` class requires a Redis server binary to function. It will look for Redis in the following order:

1. System-wide installation
2. Local Redis binary

If the RedisServer utility fails to locate a Redis binary, a `RedisServerBinaryNotFoundError` error is thrown.

## Obtaining a Redis Binary

### Option 1: Install Redis

It is recommended to ensure that Redis is installed on your host system and accessible to the user account under which 
your application is run.

Use your package manager to install Redis. For example on Ubuntu/Debian systems:

```shell
sudo apt-get install redis-server
```

You can verify the installation by running: 

```shell
redis-server --version
```

This option is simple and reliable for most environments but requires administrative privileges.

### Option 2: Build Redis from source

In case you cannot rely on pre-installed binaries, you can build Redis from source by running:

```shell
pnpm -F redis-smq-common redis:build
```

**Requirements**

Ensure your system has development tools installed. For example on Debian/Ubuntu systems run:

```shell
sudo agt-get install build-essential
```

### Option 3: Download a pre-built Redis binary

Retrieve pre-built Redis binaries if building from source is not feasible.

```shell
pnpm -F redis-smq-common redis:download
```

Pre-built binaries are retrieved from GitHub (https://github.com/weyoss/valkey).

This option is quick and easy to set up without requiring compilation but you but prebuilt binaries may not be compatible 
with all systems due to environment differences (e.g., GLIBC version mismatches).

## Supported Platforms

- Linux x64
- Linux arm64
- Linux x86
- macOS x64
- macOS arm64

## Usage Examples

```javascript
import { RedisServer } from './redis-server';

const redisServer = new RedisServer();

// Start Redis on an automatically assigned free port
const port = await redisServer.start();
console.log(`Redis server started on port ${port}`);

// Start Redis on a specific port
await redisServer.start(3333);

// Shut down the Redis server
await redisServer.shutdown();
```

## Error Handling

It's important to implement proper error handling when working with the Redis server:

```javascript
try {
  const port = await redisServer.start();
  console.log(`Redis server started on port ${port}`);
} catch (error) {
  console.error('Failed to start Redis server:', error.message);
  // Handle the error appropriately
}

try {
  await redisServer.shutdown();
  console.log('Redis server shut down successfully');
} catch (error) {
  console.error('Failed to shut down Redis server:', error.message);
  // Handle the error appropriately
}
```

## Important Notes

- All RedisSMQ package tests rely on `RedisServer` to launch local server instances. Ensure you have a working 
RedisServer setup (option 1/option 2/option 3) before running tests.

- This utility is designed for development and testing only. For production environments, use a dedicated Redis server instance.


