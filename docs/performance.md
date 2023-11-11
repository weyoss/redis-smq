[RedisSMQ](../README.md) / [Docs](README.md) / Performance


# Performance

> Out-of-box RedisSMQ is optimized for performance. But if you are using a custom configuration, you should consider disabling the following features, in your production environment: logging, monitor server, storing acknowledged & dead-lettered messages.


## Scenarios

One key indicator about how RedisSMQ is fast and performant is Message throughput. Message throughput is the number of messages per second that the message queue can process.

We can measure the Producer throughput and the Consumer throughput. The benchmark is composed of:

1. Measuring Producer throughput (without consumers running at the same time)
2. Measuring Consumer throughput (without producers running at the same time)
3. Measuring throughput of Producer and Consumer both running at the same time

In all scenarios messages are produced and consumed as fast as possible.

## Environment

The benchmark was performed on a KVM virtual machine (4 CPU cores, 8GB RAM) hosted on a desktop computer (CPU AMD FX8350, RAM 32 GB) running Debian 8.

No performance tuning was performed for the VM, neither for Redis server.

The virtual machine was set up to run a single instance of Redis (Redis is single threaded, so more instances can boost performance).

All consumers/producers instances and Redis server are launched from the same host.

## Results

| Scenario                                            | Producer rate (msg/sec) | Consumer rate (msg/sec) |
|-----------------------------------------------------|-------------------------|-------------------------|
| Run 1 producer instance                             | 23K+                    | 0                       |
| Run 10 producer instances                           | 96K+                    | 0                       |
| Run 1 consumer instance                             | 0                       | 13K+                    |
| Run 10 consumer instances                           | 0                       | 49K+                    |
| Run 1 producer instance and 1 consumer instance     | 22K+                    | 12K+                    |
| Run 10 producer instances and 10 consumer instances | 45K+                    | 27K+                    |
| Run 10 producer instances and 20 consumer instances | 32K+                    | 32K+                    |
