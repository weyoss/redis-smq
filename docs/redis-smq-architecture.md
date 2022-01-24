# RedisSMQ Architecture Overview

High-level overview of how RedisSMQ works:

- An application publishes messages using a producer.
- Consumers pull messages off queues and start processing.
- If an error occurs, messages are unacknowledged. Otherwise, once acknowledged, messages are moved to the `acknowledged queue`.
- Unacknowledged messages are re-queued with optional `retryDelay`. When `retryThreshold` is exceeded, messages are put in the `deal-letter queue`.

&nbsp;

![RedisSMQ Architecture Overview](/docs/redis-smq-architecture-overview.png)
