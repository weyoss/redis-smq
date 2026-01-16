# RedisSMQ Common Library

[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq-common/next?style=flat-square&label=redis-smq-common%40next)](https://github.com/weyoss/redis-smq/releases)
[![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/next?flag=redis-smq-common&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-common)

> 💡 You are on the "next" branch, featuring the latest updates and upcoming features. For stable releases, please refer to the "master" branch. See https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-common.

A shared foundation for the RedisSMQ ecosystem.
This package provides essential components and utilities used by RedisSMQ and related packages, helping you configure
Redis clients, structure logging, and reuse core types across the stack.

## Features

- Core types and utilities shared across RedisSMQ packages
- Configuration helpers and enums (e.g., select Redis client implementation)
- Logging interfaces and a Console logger implementation
- Redis client abstractions and guidance for supported clients
- File-based synchronization primitives (e.g., FileLock)
- Thorough documentation for server/client setup and usage

## Installation

Install the package:

```bash
npm install redis-smq-common@next
# or
pnpm add redis-smq-common@next
```

This package works with multiple Redis clients. Install one of the supported clients based on your needs:

- ioredis (recommended for advanced features)

```shell
npm install ioredis
```

- @redis/client (official Redis client)

```shell
npm install @redis/client
```

Note: Redis clients are optional peer dependencies; pick one and configure it in your application.

## Version compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq/docs/version-compatibility.md) for details.

## Documentation

For in-depth guides and API references, see [the documentation page](https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq-common/docs/README.md).

## Related packages

- [redis-smq](https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq/README.md): Core message queue for Node.js
- [redis-smq-rest-api](https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq-rest-api/README.md): REST API with OpenAPI v3 and Swagger UI
- [redis-smq-web-server](https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq-web-server/README.md): Web server for hosting the UI and proxying/serving the API
- [redis-smq-web-ui](https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq-web-ui/README.md): SPA for monitoring and managing RedisSMQ

## License

RedisSMQ Common Library is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/next/LICENSE).