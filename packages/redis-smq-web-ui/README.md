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
- History-fallback friendly routing (works correctly under a sub-path when configured)

## Version compatibility

Always install matching versions of RedisSMQ packages (same major/minor) to avoid runtime/API mismatches. See
[version-compatibility.md](/packages/redis-smq/docs/version-compatibility.md).

## Requirements

See [requirements of RedisSMQ](/README.md).

## Installation

Typically consumed via the [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md). To set up everything with pre-release builds:

```bash
npm install redis-smq@next redis-smq-common@next redis-smq-rest-api@next redis-smq-web-ui@next redis-smq-web-server@next
# Choose a Redis client:
npm install ioredis
# or
npm install @redis/client
```

## Quick start

Use the [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md) to serve the UI and either mount the REST API in-process or proxy to an external instance.

- In-process API (default):
  - UI at http://localhost:8080/
  - API at http://localhost:8080/api
- Proxy to an external REST API:
  - UI is served locally
  - API/docs/assets are forwarded to the upstream API

Examples:

```bash
# Default (UI at /, API at /api)
npx redis-smq-web-server

# Serve under a sub-path (e.g., behind a reverse proxy)
npx redis-smq-web-server --base-path /redis-smq

# Proxy API/docs/assets to an external REST API
npx redis-smq-web-server --api-proxy-target http://127.0.0.1:7210
```

See [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md) for CLI options such as:

- `--port`
- `--base-path`
- `--api-proxy-target`
- Redis connection and logging options (used only when hosting the API in-process)

## Configuration and routing

- Base path
  - When served by [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md), basePath controls where the UI and local API/docs are mounted.
  - Examples:
    - basePath = / → UI at /, API at /api, Swagger UI at /docs
    - basePath = /redis-smq → UI at /redis-smq, API at /redis-smq/api, Swagger UI at /redis-smq/docs

- API endpoint
  - With an embedded API (no proxy): the server mounts the REST API alongside the UI under <basePath>/api.
  - With a proxy target: the server forwards <basePath>/api, <basePath>/docs, and <basePath>/assets to the configured upstream URL.

- Standalone/static hosting (advanced)
  - If hosting the UI assets yourself:
    - Serve the SPA with history fallback (so client-side routes work on refresh).
    - Ensure the public base path matches where you host the app.
    - Proxy API requests to the REST API under the same public base path (e.g., <basePath>/api).
    - Expose <basePath>/docs and <basePath>/assets if you want Swagger UI and API schema accessible.
  - Note: [RedisSMQ Web Server](/packages/redis-smq-web-server/README.md) already handles these concerns and is the simplest path.

## Deploying behind a reverse proxy

- Set a public sub-path using the web server’s --base-path (e.g., /redis-smq).
- Forward both the UI and API prefixes through your proxy:
  - /redis-smq → web server
- If proxying the API to an external service, combine with --api-proxy-target:
  - Client → reverse proxy → web server (/redis-smq)
  - Web server proxies /redis-smq/api, /redis-smq/docs, /redis-smq/assets → external API

## Related packages

- [redis-smq](../redis-smq/README.md): Core message queue
- [redis-smq-common](../redis-smq-common/README.md): Shared components/utilities
- [redis-smq-rest-api](../redis-smq-rest-api/README.md): REST API with OpenAPI v3 and Swagger UI
- [redis-smq-web-server](../redis-smq-web-server/README.md): Static hosting + in-process or proxied API

## Contributing

Contributions are welcome. Please see the repository’s [CONTRIBUTING.md](/CONTRIBUTING.md) in the project root.

## License

RedisSMQ Web UI is released under the [MIT License](/LICENSE).
