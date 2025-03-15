[RedisSMQ](../README.md) / [Docs](README.md) / RedisSMQ Architecture Overview

# RedisSMQ Architecture Overview

This document provides a high-level overview of the RedisSMQ architecture, illustrating how it facilitates message
queuing and processing.

## Key Components and Workflow

1. **Message Publishing**:

   - Applications publish messages to RedisSMQ using producers.

2. **Message Consumption**:

   - Consumers retrieve messages from the queues and begin processing them.

3. **Acknowledgment Process**:

   - Upon successful processing, messages are acknowledged and then moved to the **Acknowledged Queue**.
   - If an error occurs during processing, these messages remain **Unacknowledged**.

4. **Error Handling and Retries**:
   - Unacknowledged messages are re-queued and retried after a specified optional **retryDelay**.
   - If the number of retries exceeds the defined **retryThreshold**, the messages are moved to the **Dead-Letter Queue** for further inspection.

&nbsp;

![RedisSMQ Architecture Overview](/docs/redis-smq-architecture-overview.png)

This structured workflow ensures efficient message handling, error management, and allows for seamless interactions between producers and consumers.
