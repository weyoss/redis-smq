# RedisSMQ Web Server

[![Release (latest)](https://img.shields.io/npm/v/redis-smq-web-server/latest?style=flat-square&label=redis-smq-web-server%40latest)](https://www.npmjs.com/package/redis-smq-web-server?activeTab=versions)
[![Code Coverage (latest)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/master?flag=redis-smq-web-server&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/master/packages/redis-smq-web-server)

A lightweight server that brings the RedisSMQ management ecosystem to life. It serves the official Web UI and provides
the REST API through two flexible modes of operation:

- **Standalone Mode:** Run the Web UI and REST API in a single process for an all-in-one setup.
- **Proxy Mode:** Serve the Web UI and proxy API requests to a separate redis-smq-rest-api instance for distributed deployments.

## Features

- **Dual-Mode Operation:** Standalone (UI + API in one process) or Proxy (UI + proxied API).
- **Versatile Execution:** Start from the CLI as a standalone server or embed as a library in your Node.js app.
- **Consistent Ecosystem:** Works seamlessly with `redis-smq`, `redis-smq-rest-api`, and `redis-smq-web-ui`.

## Installation

```bash
# Using npm
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next --save
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

For in-depth guides and API references, see [the documentation page](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-web-server/docs/README.md).

## Related packages

- [redis-smq](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq/README.md): Core message queue
- [redis-smq-common](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-common/README.md): Shared components/utilities
- [redis-smq-rest-api](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-rest-api/README.md): REST API with OpenAPI v3 and Swagger UI
- [redis-smq-web-ui](https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-web-ui/README.md): SPA for monitoring and managing RedisSMQ

## License

RedisSMQ Web Server is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/master/LICENSE).
