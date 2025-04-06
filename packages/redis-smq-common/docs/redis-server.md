[RedisSMQ Common Library](../README.md) / Redis Server

# Redis Server

The RedisServer class is a lightweight utility for managing the lifecycle of a Redis server process. It is designed for 
applications that require an embedded Redis server, such as testing environments or local development setups. 
This utility ensures a Redis server binary is available, either by using a system-wide installation or by downloading 
and using a pre-compiled one.

## How It Works

The RedisServer class relies on the redis-server binary to launch the server.
It first checks for a system-wide Redis installation. If none is found, it downloads and uses a pre-compiled binary.
The server can be started on a specified port or on an automatically assigned free port.

## Supported platforms

The `RedisServer` utility supports the following platforms:

- Linux x64
- Linux arm64
- Linux x86
- macOS x64
- macOS arm64

## Use Case

This utility is primarily designed as an embedded standalone server for testing and development purposes. 
It allows the creation of multiple Redis server instances on the same machine, each running on a unique port. 
This capability is particularly useful for parallel testing scenarios, where isolated Redis instances are required to 
be created dynamically on the fly.

## Usage

```js
import { RedisServer } from './redis-server';

const redisServer = new RedisServer();

// Starting the Redis server
const port = await redisServer.start()
console.log(`Redis server started on port ${port}`);

// Starting the Redis server on a specific port
const port = 3333;
await redisServer.start(port)

// Shutting down the Redis server
await redisServer.shutdown()

```

## Notes

The RedisServer class is lightweight and designed for simplicity, making it ideal for testing and development scenarios.
For production environments, consider using a dedicated Redis server instance.


