[RedisSMQ](../README.md) / Docs

# RedisSMQ Documentation

Welcome to the RedisSMQ documentation! This comprehensive guide will help you implement and optimize message queuing in
your applications.

## Quick Start

- **[Simplified API](simplified-redis-smq-api.md)**:
- **[Configuration](configuration.md)**: Set up RedisSMQ in your environment
- **[Version Compatibility](version-compatibility.md)**: Ensure compatibility between RedisSMQ packages
- **[ESM & CJS Modules](esm-cjs-modules.md)**: Choose between ECMAScript Modules and CommonJS

## Core Concepts

### Queue Management

- **[Queues](queues.md)**: Understand how to create and manage queues to process messages
- **[Queue Delivery Models](queue-delivery-models.md)**: Explore different delivery models available for your queues
- **[Queue Rate Limiting](queue-rate-limiting.md)**: Understand how to implement rate limiting for your queues

### Message Handling

- **[Messages](messages.md)**: Get a comprehensive overview of message handling within RedisSMQ
- **[Message Storage](message-storage.md)**: Understand how messages are stored, retained, and managed in Redis
- **[Producing Messages](producing-messages.md)**: Discover how to produce and send messages to your queues
- **[Consuming Messages](consuming-messages.md)**: Get insights into how to consume and process messages from your
  queues
- **[Scheduling Messages](scheduling-messages.md)**: Find out how to schedule messages for future delivery
- **[Message Exchanges](message-exchanges.md)**: Learn about message exchange patterns and how they work in RedisSMQ

## Advanced Features

### Performance & Scaling

- **[Message Handler Worker Threads](message-handler-worker-threads.md)**: Improve message handler isolation and
  consumer performance
- **[Multiplexing](multiplexing.md)**: Consume multiple queues with a single consumer and limited resources
- **[Performance](performance.md)**: Get an overview about RedisSMQ performance

### Architecture & Integration

- **[RedisSMQ Architecture](redis-smq-architecture.md)**: Gain insights into the architectural design of RedisSMQ
- **[EventBus](event-bus.md)**: Discover the EventBus feature for event-driven architecture
- **[Exchanges and Delivery Models](exchanges-and-delivery-models.md)**: Delve deeper into the interplay between
  exchanges and delivery models

### Operations

- **[Graceful Shutdown](graceful-shutdown.md)**: Safely manage system shutdown
- **[Logs](/packages/redis-smq-common/docs/logger.md)**: Learn how to
  access and utilize logs for monitoring and debugging

## Tools & Interfaces

- **[HTTP REST API](../../../packages/redis-smq-rest-api/README.md)**: Access the HTTP API for integrating RedisSMQ with
  other applications
- **[Web UI](../../../packages/redis-smq-web-ui/README.md)**: Explore the web interface for easy management of RedisSMQ
- **[Redis Server](../../../packages/redis-smq-common/docs/redis-server.md)**: Learn how to start a Redis server
  instance for development and testing

## Reference

- **[API Reference](api/README.md)**: Complete API documentation
- **[FAQs](faqs/README.md)**: Common questions and solutions

## Additional Resources

- [GitHub Repository](/README.md)
- [Issue Tracker](https://github.com/weyoss/redis-smq/issues)
- [Changelog](/CHANGELOG.md)

## Support

Need help? Check our [FAQs](faqs/README.md) or open an [issue](https://github.com/weyoss/redis-smq/issues).
