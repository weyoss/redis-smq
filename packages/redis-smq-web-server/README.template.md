# RedisSMQ Web Server

__NPM_BADGE__
__CODECOV_BADGE__

__IS_NEXT_NOTE__

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
npm install redis-smq__TAG_SUFFIX__ redis-smq-common__TAG_SUFFIX__ redis-smq-rest-api__TAG_SUFFIX__ redis-smq-web-ui__TAG_SUFFIX__ redis-smq-web-server__TAG_SUFFIX__ --save
```

Don't forget to install a Redis client:

```shell
npm install @redis/client --save
# or
npm install ioredis --save
```

## Version Compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/packages/redis-smq/docs/version-compatibility.md) for details.

## Documentation

For in-depth guides and API references, see [the documentation page](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/packages/redis-smq-web-server/docs/README.md).

## Related packages

- [redis-smq](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/packages/redis-smq/README.md): Core message queue
- [redis-smq-common](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/packages/redis-smq-common/README.md): Shared components/utilities
- [redis-smq-rest-api](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/packages/redis-smq-rest-api/README.md): REST API with OpenAPI v3 and Swagger UI
- [redis-smq-web-ui](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/packages/redis-smq-web-ui/README.md): SPA for monitoring and managing RedisSMQ

## License

RedisSMQ Web Server is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/__BRANCH_NAME__/LICENSE).
