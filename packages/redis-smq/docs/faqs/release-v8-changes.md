[RedisSMQ](../README.md) / [Docs](README.md) / [FAQs](README.md) / What are the most important features and changes that RedisSMQ v8 introduces?

**What are the most important features and changes that RedisSMQ v8 introduces?**

RedisSMQ v8 introduces a significant overhaul of the Redis-SMQ library, making the library more robust and easier to use.

Here are some of the key changes:

1. Queue-Scoped Workers

   - This Replaces global workers with queue-scoped workers, allowing better isolation and management of workers and more granular control over message processing for individual queues.

2. Pub/Sub Delivery Model

   - A new Pub/Sub (Publish/Subscribe) delivery model has been added, enabling more flexible message distribution patterns where multiple consumers can receive the same message.

3. Worker Threads for Message Handlers

   - This feature allows running and sandboxing message handlers using worker threads, improving performance and isolation of message processing, potentially reducing the impact of long-running or resource-intensive message handlers on the main application thread.

4. New Message Handling and Tracking Features

   - Introduces message status tracking and the ability to return message IDs for produced messages, enhancing visibility into message lifecycle and improving the ability to track and manage messages within the system.

5. Event System Overhaul

   - Implemented typed events and removed legacy events, improving type safety and making the event system more robust and easier to use correctly.

6. API Changes and Improvements

   - Various changes and improvements to the API. While specific details aren't provided in the changelog, these changes likely aim to make the API more consistent, easier to use, and more powerful.

7. Error Handling Improvements

   - Introduction of more granular error classes for better error reporting and handling, making it easier to identify and resolve issues in applications using Redis-SMQ.

8. Performance Improvements

   - Various optimizations and refactoring for better performance. These changes result in improved throughput and reduced resource usage for applications using Redis-SMQ.

9. Documentation Updates

   - Extensive updates to documentation, API references, and examples, making it easier for developers to understand and correctly use the library.

10. Codebase Refactoring

    - Significant refactoring across multiple components. While not directly visible to users, this refactoring improves the maintainability, readability, and potentially the performance of the codebase.

11. Message Handling Changes

    - Introduced new classes (ProducibleMessage, ConsumableMessage, and MessageEnvelope) classes and methods for more structured and type-safe ways to work with messages at different stages of their lifecycle.

12. Queue Messages API Changes
    - Streamlined API for working with messages and queues, including reorganization of methods and removal of redundant functionality

Users upgrading from 7.2.3 to 8.0.0 should expect to make significant changes to their implementation due to the API changes and new features. However, these changes should ultimately result in a more powerful, flexible, and maintainable message queue system.
