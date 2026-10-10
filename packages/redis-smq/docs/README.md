[RedisSMQ](../README.md) / TypeScript Documentation

# TypeScript Documentation

Node.js implementation of RedisSMQ. For concepts that apply to all implementations, see the [shared documentation](https://github.com/weyoss/redis-smq-docs).

> **New to RedisSMQ?** Start with the [Quick Start](quick-start.md) to install, initialize, and send a first message. Then read [Configuration](configuration.md) to understand the namespace, logger, and message-audit settings before wiring up your own application.

## Getting Started

- [Quick Start](quick-start.md) — Install, initialize, send and receive your first message
- [Installation](installation.md) — Package installation, Redis client selection, and version alignment
- [Simplified API](simplified-redis-smq-api.md) — Factory methods, component tracking, and automatic cleanup
- [Configuration](configuration.md) — Namespace, logging, and message-audit settings

## Core Operations

- [Producing Messages](producing-messages.md) — Queues, exchanges, priority, retry policy, and scheduling options
- [Consuming Messages](consuming-messages.md) — Handler styles, consumer groups, and consumption lifecycle
- [Exchanges and Delivery Models](exchanges-and-delivery-models.md) — Direct, topic, and fanout routing; Point-to-Point vs Pub/Sub
- [Queue Management](queue-management.md) — Create, inspect, and delete queues
- [Message Management](message-management.md) — Retrieve, delete, and requeue messages by ID
- [Scheduling Messages](scheduling-messages.md) — Delays, CRON, and repeating delivery
- [Queue Rate Limiting](queue-rate-limiting.md) — Control how fast messages are consumed

## State and Monitoring

- [Queue State Management](queue-state-management.md) — Pause, resume, stop queues; view state history
- [Message Audit](message-audit.md) — Browse processed and failed messages
- [Consumer Groups](consumer-groups.md) — Manage Pub/Sub consumer groups
- [Namespaces](namespaces.md) — Isolate queues and exchanges
- [Event Bus](event-bus.md) — Subscribe to queue, producer, and consumer events in real time

## Advanced Features

- [Worker Threads](message-handler-worker-threads.md) — Run CPU-bound handlers in separate threads
- [Multiplexing](multiplexing.md) — Share one connection across multiple queues
- [Batch Acknowledgments](message-batch-acknowledgements.md) — High-throughput ack batching
- [Batch Unacknowledgments](message-batch-unacknowledgements.md) — High-throughput unack batching
- [Validating Queue Operations](validating-queue-operations.md) — Check whether an operation is allowed before attempting it

## Operations

- [Graceful Shutdown](graceful-shutdown.md) — What happens during shutdown and how to handle in-flight messages

## Node.js Specifics

- [Dual Callback & Promise Support](dual-callback-and-promise-support.md) — Use callbacks or async/await
- [ESM & CJS Modules](esm-cjs-modules.md) — Import styles for both module systems
- [Version Compatibility](version-compatibility.md) — Keep RedisSMQ packages at the same version

## API Reference

- [API Reference](api/README.md) — Complete class and interface documentation

## Shared Concepts

For language-agnostic documentation on queues, exchanges, scheduling, rate limiting, and more, see [redis-smq-docs](https://github.com/weyoss/redis-smq-docs).
