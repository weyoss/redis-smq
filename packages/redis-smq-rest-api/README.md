# RedisSMQ REST API

`redis-smq-rest-api` provides an HTTP interface enabling any web-capable application to interact with the RedisSMQ message
queue using a RESTful API.  

This package is part of the [RedisSMQ monorepo](https://github.com/weyoss/redis-smq), which contains the full TypeScript implementation.

## Release Status & Code Coverage

Track the latest npm releases and test coverage for `redis-smq-rest-api` across our active branches.

| Branch   | Latest Release                                                                                                                                                                    | Code Coverage                                                                                                                                                                                                                  |
|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `master` | [![npm (latest)](https://img.shields.io/npm/v/redis-smq-rest-api/latest?style=flat-square&label=latest)](https://www.npmjs.com/package/redis-smq-rest-api/v/latest)               | [![Code Coverage (master)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/master?flag=redis-smq-rest-api&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/master/packages/redis-smq-rest-api) |
| `next`   | [![npm (next)](https://img.shields.io/npm/v/redis-smq-rest-api/next?style=flat-square&label=next)](https://www.npmjs.com/package/redis-smq-rest-api/v/next)                       | [![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/next?flag=redis-smq-rest-api&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-rest-api)       |

> **📌 Note:** The `master` branch always points to the latest **stable, production-ready** release. The `next` branch contains **bleeding-edge development**—new features, fixes, and experimental changes that are not yet considered stable.

## Features

- 🚀 Clean and efficient implementation
- ✅ Strict request/response validation using [JSON Schema](https://json-schema.org/)
- 📚 Native [OpenAPI v3](https://www.openapis.org/) support and [Swagger UI](https://swagger.io/)
- 🧪 90%+ code coverage with extensive testing
- 📦 Support for both ESM & CJS modules

## Installation

```bash
# Using npm
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next --save
```

Don't forget to install a Redis client:

```shell
npm install @redis/client --save
# or
npm install ioredis --save
```

## Version Compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](../redis-smq/docs/version-compatibility.md) for details.

## Documentation

For in-depth guides and API references, see [the documentation page](docs/README.md):

## Related packages

- [redis-smq](../redis-smq/README.md): Core message queue
- [redis-smq-common](../redis-smq-common/README.md): Shared components/utilities
- [redis-smq-web-server](../redis-smq-web-server/README.md): Static hosting + in-process or proxied API
- [redis-smq-web-ui](../redis-smq-web-ui/README.md): SPA for monitoring and managing RedisSMQ

## License

RedisSMQ REST API is released under the [MIT License](../../LICENSE).