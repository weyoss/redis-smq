# RedisSMQ Web Server

`redis-smq-web-server` - A lightweight server that brings the RedisSMQ management ecosystem to life. It serves the
official Web UI and provides the REST API through two flexible modes of operation:

- **Standalone Mode:** Run the Web UI and REST API in a single process for an all-in-one setup.
- **Proxy Mode:** Serve the Web UI and proxy API requests to a separate redis-smq-rest-api instance for distributed deployments.

This package is part of the [RedisSMQ monorepo](https://github.com/weyoss/redis-smq), which contains the full TypeScript implementation.

## Release Status & Code Coverage

| Branch   | Latest Release                                                                                                                                                          | Code Coverage                                                                                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `master` | [![npm (latest)](https://img.shields.io/npm/v/redis-smq-web-server/latest?style=flat-square&label=latest)](https://www.npmjs.com/package/redis-smq-web-server/v/latest) | [![Code Coverage (master)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/master?flag=redis-smq-web-server&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/master/packages/redis-smq-web-server) |
| `next`   | [![npm (next)](https://img.shields.io/npm/v/redis-smq-web-server/next?style=flat-square&label=next)](https://www.npmjs.com/package/redis-smq-web-server/v/next)         | [![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/next?flag=redis-smq-web-server&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-web-server)       |

## Features

- **Dual-Mode Operation:** Standalone (UI + API in one process) or Proxy (UI + proxied API).
- **Versatile Execution:** Start from the CLI as a standalone server, embed the full server in a larger Express
  application via `getApplication()`, or mount it inside another Koa/Express host using its composed middleware stack.
- **Config Validation at Startup:** Invalid ports, malformed proxy targets, and missing Web UI bundles are reported with
  a specific error class before any HTTP listener is bound — no more mysterious 500s a minute after startup.
- **Reverse Proxy Ready:** `X-Forwarded-*` headers are trusted by default, so `req.protocol` and `req.ip` reflect the
  client, not the proxy. See [the deployment guide](docs/deploying-behind-a-reverse-proxy.md).
- **Consistent Ecosystem:** Works seamlessly with `redis-smq`, `redis-smq-rest-api`, and `redis-smq-web-ui`.

## Installation

```bash
# Using npm
npm install redis-smq redis-smq-common redis-smq-rest-api redis-smq-web-ui redis-smq-web-server --save
```

> ℹ️ The `@next` tag pulls the latest development version from the `next` branch.
> For the stable release, use `@latest` (or omit the tag). Always check the [version compatibility guide](packages/redis-smq/docs/version-compatibility.md) and the [language‑agnostic compatibility matrix](https://github.com/weyoss/redis-smq-docs#compatibility-matrix) to ensure packages and implementations are aligned.

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
