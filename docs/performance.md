[RedisSMQ](../README.md) / [Docs](README.md) / Performance

# RedisSMQ Performance

This document outlines the key performance characteristics of RedisSMQ, along with benchmarking scenarios and results 
to help you understand its efficiency.

## Overview

RedisSMQ is designed with performance optimization in mind. By default, many features are streamlined to ensure rapid 
message processing. However, if you are using a custom configuration, you may want to enhance performance further in 
production environments by disabling certain features: 

- Logging;
- The monitoring server;
- The storage of acknowledged and dead-lettered messages;

With a foundation built on pure callbacks, RedisSMQ maintains a small memory footprint and is free from memory leaks. 
For a comprehensive understanding of its efficiency, refer to the 
[Callback vs Promise vs Async/Await benchmarks](https://gist.github.com/weyoss/24f9ecbda175d943a48cb7ec38bde821).

## Message Throughput

A key metric for assessing the performance of RedisSMQ is message throughput, measured in the number of messages processed per second by the message queue. Throughput can be evaluated in three primary scenarios:

1. **Producer Throughput**: Measurement when only producer instances are running.
2. **Consumer Throughput**: Measurement when only consumer instances are active.
3. **Combined Throughput**: Measurement when both producer and consumer instances are operational simultaneously.

In each scenario, messages are produced and consumed as rapidly as possible to gauge maximum throughput.

## Benchmark Environment

The benchmarks were conducted on a KVM virtual machine with the following specifications:
- **CPU:** 4 cores
- **RAM:** 8GB
- **Host:** Desktop computer with an AMD FX8350 CPU and 32GB of RAM
- **OS:** Debian 8

No specific performance tuning was applied to the virtual machine or the Redis server settings. The virtual machine was configured to run a single instance of Redis, considering that Redis operates in a single-threaded manner; running multiple instances can enhance performance.

All instances of consumers and producers, along with the Redis server, were launched from the same host for optimal resource utilization.

## Benchmark Results

Here are the results of our benchmarking across different scenarios:

| **Scenario**                                            | **Producer Rate (msg/sec)** | **Consumer Rate (msg/sec)** |
| ------------------------------------------------------- | ---------------------------- | ---------------------------- |
| 1 Producer Instance                                     | 23K+                         | 0                            |
| 10 Producer Instances                                   | 96K+                         | 0                            |
| 1 Consumer Instance                                     | 0                            | 13K+                         |
| 10 Consumer Instances                                   | 0                            | 49K+                         |
| 1 Producer Instance & 1 Consumer Instance               | 22K+                         | 12K+                         |
| 10 Producer Instances & 10 Consumer Instances           | 45K+                         | 27K+                         |
| 10 Producer Instances & 20 Consumer Instances           | 32K+                         | 32K+                         |

## Conclusion

RedisSMQ is designed for high performance, and our benchmarks demonstrate its impressive throughput capabilities in 
various scenarios. By fine-tuning configurations according to your production needs and leveraging the insights from 
these benchmarks, you can ensure optimal performance for message processing in your applications.