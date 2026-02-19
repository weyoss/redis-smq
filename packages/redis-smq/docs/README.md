[RedisSMQ](../README.md) / Docs

# RedisSMQ Documentation

This comprehensive guide will help you implement and optimize message queuing in your applications.

## Start here

- [Simplified API](simplified-redis-smq-api.md) — Initialize once per process; create Producers, Consumers, and managers via factory methods.
- [Configuration](configuration.md) — Set up RedisSMQ in your environment.
- [Version Compatibility](version-compatibility.md) — Ensure compatibility between RedisSMQ packages.
- [ESM & CJS Modules](esm-cjs-modules.md) — Choose between ECMAScript Modules and CommonJS.

## Core concepts

- [Queues](queues.md) — Understand how to create and manage queues to process messages.
- [Queue Delivery Models](queue-delivery-models.md) — Explore different delivery models available for your queues.
- [Queue Rate Limiting](queue-rate-limiting.md) — Throttle consumption per queue.
- [Queue State Management System](queue-state-management-system.md) — Control and monitor queue operational states (pause, resume, stop) with audit trails.
- [Messages](messages.md) — Get a comprehensive overview of message handling within RedisSMQ.
- [Message Audit](message-audit.md) — Optional audit for acked/dead-lettered messages.
- [Producing Messages](producing-messages.md) — Discover how to produce and send messages to your queues.
- [Consuming Messages](consuming-messages.md) — Get insights into how to consume and process messages from your
  queues.
- [Scheduling Messages](scheduling-messages.md) — Find out how to schedule messages for future delivery.
- [Message Exchanges](message-exchanges.md) — Learn about message exchange patterns and how they work in RedisSMQ.

## Advanced

- [Message Handler Worker Threads](message-handler-worker-threads.md) — Improve message handler isolation and
  consumer performance.
- [Multiplexing](multiplexing.md) — Consume multiple queues with a single consumer and limited resources.
- [Performance](performance.md) — Get an overview about RedisSMQ performance.
- [Exchanges and Delivery Models](exchanges-and-delivery-models.md) — How routing and delivery interact.
- [RedisSMQ Architecture](redis-smq-architecture.md) — Components overview.
- [EventBus](event-bus.md) — Subscribe to internal events (opt-in).
- [Graceful Shutdown](graceful-shutdown.md) — Safely manage system shutdown.
- [Logger](../../redis-smq-common/docs/logger.md) — Learn how to
  access and utilize logs for monitoring and debugging.

## Tools & interfaces

- [HTTP REST API](../../redis-smq-rest-api/README.md) — Access the HTTP API for integrating RedisSMQ with
  other applications.
- [Web UI](../../redis-smq-web-ui/README.md) — Explore the web interface for easy management of RedisSMQ.
- [Redis Server helper](../../redis-smq-common/docs/redis-server.md) — Learn how to start a Redis server
  instance for development and testing.

## Reference

- [API Reference](api/README.md)
- [FAQs](faqs/README.md)

## Help

- [GitHub Repository](/README.md)
- [Issues](https://github.com/weyoss/redis-smq/issues)
- [Changelog](/CHANGELOG.md)
