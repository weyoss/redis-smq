# RedisSMQ Web UI

> [!NOTE]
> You are viewing the documentation for the "next" branch. These docs describe unreleased changes published under the npm "next" dist-tag.  
> For the latest stable documentation, see:
>
> - Master (stable) README: https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-web-ui
> - Latest release notes/tags: https://github.com/weyoss/redis-smq/releases/latest
> - Install stable packages with @latest; pre-release with @next.

![RedisSMQ Web UI - Home](docs/screenshots/img01.png)

A Single Page Application for monitoring and managing RedisSMQ. Inspect queues and messages, review consumers, and perform common actions — with an integrated, type-safe OpenAPI client.

- Works seamlessly with the RedisSMQ REST API
- Best served via the RedisSMQ Web Server (serves the static UI and hosts or proxies the API)
- Ships with developer-friendly types and OpenAPI client generation

## Features

- Dashboard for queues, consumers, and message stats
- Queue/message browsers with filters and actions (ack, retry, delete, etc.)
- Supports multiple queue and delivery models
- Exchange types: Direct, Topic, Fanout
- Type-safe OpenAPI client (generated from the REST API schema)

## Requirements

See [RedisSMQ requirements](/README.md).

## Installation

Typically consumed via the [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md). To set up everything with pre-release builds:

```bash
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next
# Choose a Redis client:
npm install ioredis
# or
npm install @redis/client
```

## Version Compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](/packages/redis-smq/docs/version-compatibility.md) for details.

## Documentation

For in-depth guides and API references, see the documentation:  
https://github.com/weyoss/redis-smq/tree/next/packages/redis-smq-web-server/docs

## Related packages

- [redis-smq](../redis-smq/README.md): Core message queue
- [redis-smq-common](../redis-smq-common/README.md): Shared components/utilities
- [redis-smq-rest-api](../redis-smq-rest-api/README.md): REST API with OpenAPI v3 and Swagger UI
- [redis-smq-web-server](../redis-smq-web-server/README.md): Static hosting + in-process or proxied API

## License

RedisSMQ Web UI is released under the [MIT License](/LICENSE).
