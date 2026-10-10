[RedisSMQ](../README.md) / [Documentation](README.md) / Version Compatibility

# Version Compatibility

RedisSMQ is published as several packages that are intended to be used together at the same version. Mixing versions across the RedisSMQ family can produce API errors, TypeScript type mismatches, and unexpected runtime behavior. This page explains which packages must be aligned and how to diagnose a mismatch.

## Required Packages

The RedisSMQ family consists of:

| Package                | Role                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| `redis-smq`            | The core library — producers, consumers, managers, browsers                                                   |
| `redis-smq-common`     | Shared primitives — `Runnable`, `ICallback`, `IRedisClient`, `Heartbeat`, error base classes, async utilities |
| `redis-smq-rest-api`   | HTTP REST API for queue operations                                                                            |
| `redis-smq-web-ui`     | The web dashboard                                                                                             |
| `redis-smq-web-server` | Server runtime for the web UI                                                                                 |

All of them must be on the same version. `redis-smq-common` in particular is a **peer dependency** of `redis-smq` and is imported at runtime from many code paths — a version skew there fails immediately, not at some distant code path.

`redis-smq` also lists `ioredis` and `@redis/client` as **optional** peer dependencies. Exactly one of them is needed; both are supported. Their versions are not tied to the RedisSMQ family version — install a recent major of whichever client you choose.

## Installation

### Latest Versions

```bash
npm install redis-smq@latest redis-smq-common@latest \
  redis-smq-rest-api@latest redis-smq-web-ui@latest redis-smq-web-server@latest
```

If you do not use the REST API or web UI, install only the packages you need — but keep `redis-smq` and `redis-smq-common` in lockstep:

```bash
npm install redis-smq@latest redis-smq-common@latest
```

### A Specific Version

Pin all family packages to the same version:

```bash
npm install redis-smq@10.1.2 redis-smq-common@10.1.2 \
  redis-smq-rest-api@10.1.2 redis-smq-web-ui@10.1.2 redis-smq-web-server@10.1.2
```

Substitute the version you actually want — the example above uses the current release at the time of writing.

## Prerequisites

- **Node.js 22 or later.** `redis-smq@10.x` declares `"engines": { "node": ">=22" }`. Older versions of Node may install with a warning or fail outright, depending on your npm configuration.
- **A supported Redis client.** `ioredis` (v5+) or `@redis/client` (v5+). Install one, not both, unless your project already uses both for other reasons.
- **Redis 4 or later.**

## Checking Installed Versions

```bash
npm list redis-smq redis-smq-common \
  redis-smq-rest-api redis-smq-web-ui redis-smq-web-server
```

The output shows the resolved version of each package. If any entry is flagged `invalid` or the versions do not match, you have a skew.

With yarn:

```bash
yarn why redis-smq-common
```

With pnpm:

```bash
pnpm list redis-smq redis-smq-common
```

## What a Skew Looks Like

Symptoms depend on which package is out of step:

| Mismatch                                                                        | Typical symptom                                                                                                                                                             |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `redis-smq-common` differs from `redis-smq`                                     | Runtime `TypeError` or `Cannot find module` deep inside the library. The `ICallback` and `IRedisClient` shapes are used pervasively; a change to either breaks immediately. |
| `redis-smq-rest-api` differs from `redis-smq`                                   | The REST handlers import contracts from `redis-smq`; a shape change causes `undefined` fields and validation failures at request time.                                      |
| `redis-smq-web-ui` / `redis-smq-web-server` differs from `redis-smq-rest-api`   | The UI and the server exchange typed payloads; a version skew between them shows up as broken pages or empty dashboards, not as a build failure.                            |
| `redis-smq` and `redis-smq-common` are current but Redis itself is older than 4 | Lua scripts rely on `ZPOPLPUSH`, `SSCAN` variants, and other commands that older servers may not support. The library surfaces this as script errors on first use.          |

## Fixing a Mismatch

1. **Identify the skewed package.** `npm list redis-smq redis-smq-common` and look for the one that does not match.
2. **Align the versions.** Update every RedisSMQ-family package in your `package.json` to the same version, then reinstall.
3. **If npm is holding a stale tree**, delete `node_modules` and the lockfile, then reinstall:

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

   Yarn and pnpm use analogous steps (`yarn.lock` / `pnpm-lock.yaml`).

   Note: clearing the npm cache (`npm cache clean --force`) is almost never the fix. npm's cache is content-addressed and safe to leave alone; the problem is in `node_modules` and the lockfile, not the cache.

4. **If you use a monorepo with workspaces**, make sure the version specifiers in every workspace's `package.json` resolve to the same version. `workspace:^` and `workspace:*` specifiers work when the entire workspace is installed together; they can produce skews when a single workspace is installed standalone.

## Related

- [Installation](installation.md) — Package setup and Redis client selection
- [ESM & CJS Modules](esm-cjs-modules.md) — Module resolution and TypeScript
- [Quick Start](quick-start.md) — End-to-end example
