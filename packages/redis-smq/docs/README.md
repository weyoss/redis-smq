# TypeScript Documentation

Node.js implementation of RedisSMQ. For concepts that apply to all implementations, see the [shared documentation](https://github.com/weyoss/redis-smq-docs).

## Getting Started

- [Quick Start](quick-start.md) — Install, initialize, send and receive your first message
- [Installation](installation.md) — Package installation and Redis client setup
- [Simplified API](simplified-redis-smq-api.md) — One initialization, factory methods, automatic cleanup
- [Configuration](configuration.md) — System initialization and behavior configuration

## Core Operations

- [Producing Messages](producing-messages.md) — How to publish messages
- [Consuming Messages](consuming-messages.md) — How to subscribe and process messages
- [Exchanges and Delivery Models](exchanges-and-delivery-models.md) — Routing and delivery patterns
- [Queue Management](queue-management.md) — Create, inspect, and delete queues
- [Message Management](message-management.md) — Retrieve, delete, and requeue messages
- [Scheduling Messages](scheduling-messages.md) — Delays, CRON, and repeating delivery
- [Queue Rate Limiting](queue-rate-limiting.md) — Control message throughput

## State and Monitoring

- [Queue State Management](queue-state-management.md) — Pause, resume, stop queues
- [Message Audit](message-audit.md) — Browse processed and failed messages
- [Consumer Groups](consumer-groups.md) — Manage Pub/Sub consumer groups
- [Namespaces](namespaces.md) — Isolate queues and exchanges
- [Event Bus](event-bus.md) — Monitor system events in real time

## Advanced Features

- [Worker Threads](message-handler-worker-threads.md) — Run handlers in separate threads
- [Multiplexing](multiplexing.md) — Share connections across queues
- [Batch Acknowledgments](message-batch-acknowledgements.md) — High-throughput ack batching
- [Batch Unacknowledgments](message-batch-unacknowledgements.md) — High-throughput nack batching
- [Validating Queue Operations](validating-queue-operations.md) — Check if operations are allowed

## Operations

- [Graceful Shutdown](graceful-shutdown.md) — Clean shutdown procedures

## Node.js Specifics

- [Dual Callback & Promise Support](dual-callback-and-promise-support.md) — Use callbacks or async/await
- [ESM & CJS Modules](esm-cjs-modules.md) — Import styles
- [Version Compatibility](version-compatibility.md) — Package version alignment

## API Reference

- [API Reference](api/README.md) — Complete class and interface documentation

## Shared Concepts

For language-agnostic documentation on queues, exchanges, scheduling, rate limiting, and more, see [redis-smq-docs](https://github.com/weyoss/redis-smq-docs).
