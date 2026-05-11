# RedisSMQ Web UI

`redis-smq-web-ui` - A Single Page Application for monitoring and managing RedisSMQ. Inspect queues and messages, review consumers, and perform common actions — with an integrated, type-safe OpenAPI client.

- Works seamlessly with the RedisSMQ REST API
- Best served via the RedisSMQ Web Server (serves the static UI and hosts or proxies the API)
- Ships with developer-friendly types and OpenAPI client generation

This package is part of the [RedisSMQ monorepo](https://github.com/weyoss/redis-smq), which contains the full TypeScript implementation.

![RedisSMQ Web UI - Home](https://raw.githubusercontent.com/weyoss/redis-smq/master/packages/redis-smq-web-ui/docs/screenshots/redis-smq_web_ui_home.png)

## Features

- Dashboard for queues, consumers, and message stats
- Queue/message browsers with filters and actions (ack, retry, delete, etc.)
- Supports multiple queue and delivery models
- Exchange types: Direct, Topic, Fanout
- Type-safe OpenAPI client (generated from the REST API schema)

## Requirements

See [RedisSMQ requirements](../redis-smq/README.md).

## Installation

Typically consumed via the [RedisSMQ Web Server](../redis-smq-web-server/README.md). To set up everything:

```bash
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next
# Choose a Redis client:
npm install ioredis
# or
npm install @redis/client
```

## Version Compatibility

Always install matching versions of RedisSMQ packages to ensure compatibility. See [version compatibility](../redis-smq/docs/version-compatibility.md) for details.

## Documentation

For in-depth guides and API references, see [the documentation page](docs/README.md).

## License

RedisSMQ Web UI is released under the [MIT License](../../LICENSE).