# RedisSMQ REST API

[![Release (latest)](https://img.shields.io/npm/v/redis-smq-rest-api/latest?style=flat-square&label=redis-smq-rest-api%40latest)](https://www.npmjs.com/package/redis-smq-rest-api?activeTab=versions)
[![Code Coverage (latest)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/master?flag=redis-smq-rest-api&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/master/packages/redis-smq-rest-api)

RedisSMQ REST API provides an HTTP interface enabling any web-capable application to interact with the RedisSMQ message
queue using a RESTful API.

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

Don't forget to install a Redis client. Choose either node-redis or ioredis:

```shell
npm install @redis/client --save
# or
npm install ioredis --save
```

## Version Compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/docs/version-compatibility.md) for details.

## Documentation

For in-depth guides and API references, see [the documentation page](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-rest-api/docs/README.md):

## Related packages

- [redis-smq](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/README.md): Core message queue
- [redis-smq-common](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-common/README.md): Shared components/utilities
- [redis-smq-web-server](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-web-server/README.md): Static hosting + in-process or proxied API
- [redis-smq-web-ui](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-web-ui/README.md): SPA for monitoring and managing RedisSMQ

## License

RedisSMQ REST API is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/master/LICENSE).
