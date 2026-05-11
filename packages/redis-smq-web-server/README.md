# RedisSMQ Web Server

`redis-smq-web-server` - A lightweight server that brings the RedisSMQ management ecosystem to life. It serves the 
official Web UI and provides the REST API through two flexible modes of operation:

- **Standalone Mode:** Run the Web UI and REST API in a single process for an all-in-one setup.
- **Proxy Mode:** Serve the Web UI and proxy API requests to a separate redis-smq-rest-api instance for distributed deployments.

This package is part of the [RedisSMQ monorepo](https://github.com/weyoss/redis-smq), which contains the full TypeScript implementation.

## Release Status & Code Coverage

| Branch    | Latest Release                                                                                                                                                          | Code Coverage                                                                                                                                                                                                                      |                                                                                                                                                                                                           
|-----------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `master`  | [![npm (latest)](https://img.shields.io/npm/v/redis-smq-web-server/latest?style=flat-square&label=latest)](https://www.npmjs.com/package/redis-smq-web-server/v/latest) | [![Code Coverage (master)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/master?flag=redis-smq-web-server&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/master/packages/redis-smq-web-server) |
| `next`    | [![npm (next)](https://img.shields.io/npm/v/redis-smq-web-server/next?style=flat-square&label=next)](https://www.npmjs.com/package/redis-smq-web-server/v/next)         | [![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/next?flag=redis-smq-web-server&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-web-server)       |

> **📌 Note:** The `master` branch always points to the latest **stable, production-ready** release. The `next` branch contains **bleeding-edge development**—new features, fixes, and experimental changes that are not yet considered stable.

## Features

- **Dual-Mode Operation:** Standalone (UI + API in one process) or Proxy (UI + proxied API).
- **Versatile Execution:** Start from the CLI as a standalone server or embed as a library in your Node.js app.
- **Consistent Ecosystem:** Works seamlessly with `redis-smq`, `redis-smq-rest-api`, and `redis-smq-web-ui`.

## Installation

```bash
# Using npm
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next --save
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

For in-depth guides and API references, see [the documentation page](docs/README.md).

## License

RedisSMQ Web Server is released under the [MIT License](../../LICENSE).