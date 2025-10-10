# RedisSMQ Common Library

> [!NOTE]
> You are viewing the documentation for the "next" branch. These docs describe unreleased changes published under the npm "next" dist-tag.  
> For the latest stable documentation, see:
>
> - Master (stable) README: https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-common
> - Latest release notes/tags: https://github.com/weyoss/redis-smq/releases/latest
> - Install stable packages with @latest; pre-release with @next.

[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq-common/next?style=flat-square&label=redis-smq-common%40next)](https://www.npmjs.com/package/redis-smq-common?activeTab=versions)
[![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq?flag=redis-smq-common&branch=next&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-common)

A shared foundation for the RedisSMQ ecosystem.
This package provides essential components and utilities used by RedisSMQ and related packages, helping you configure
Redis clients, structure logging, and reuse core types across the stack.

- Used by: `redis-smq`, `redis-smq-rest-api`, `redis-smq-web-server`, and `redis-smq-web-ui`
- Node.js 20+ is required

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

Always use matching versions of the RedisSMQ packages across your project to avoid runtime/API mismatches.
See the monorepo documentation for Version Compatibility guidance.

## Documentation

For in-depth guides and API references, see the documentation:  
https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq-common/docs

## Related packages

- [redis-smq](../redis-smq/README.md): Core message queue for Node.js
- [redis-smq-rest-api](../redis-smq-rest-api/README.md): REST API with OpenAPI v3 and Swagger UI
- [redis-smq-web-server](../redis-smq-web-server/README.md): Web server for hosting the UI and proxying/serving the API
- [redis-smq-web-ui](../redis-smq-web-ui/README.md): SPA for monitoring and managing RedisSMQ

## Contributing

Issues and pull requests are welcome. Please read the repository’s CONTRIBUTING.md at the project root before submitting changes.

## License

This project is licensed under is released under the [MIT License](/LICENSE).
