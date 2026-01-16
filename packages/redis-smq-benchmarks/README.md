# RedisSMQ Benchmarks

[![Pre-release (next)](https://img.shields.io/npm/v/redis-smq-benchmarks/next?style=flat-square&label=redis-smq-benchmarks%40next)](https://github.com/weyoss/redis-smq/releases)
[![Code Coverage (next)](https://img.shields.io/codecov/c/github/weyoss/redis-smq/next?flag=redis-smq-benchmarks&style=flat-square)](https://app.codecov.io/github/weyoss/redis-smq/tree/next/packages/redis-smq-benchmarks)

> 💡 You are on the "next" branch, featuring the latest updates and upcoming features. For stable releases, please refer to the "master" branch. See https://github.com/weyoss/redis-smq/tree/master/packages/redis-smq-benchmarks.

A comprehensive benchmarking suite for RedisSMQ message queue system, measuring throughput, latency, and end-to-end 
performance under various workloads.

## 📊 Overview

This benchmark suite provides tools to measure RedisSMQ performance across different scenarios:

1. **Producer Throughput** - Measure message production rates
2. **Consumer Throughput** - Measure message consumption rates
3. **End-to-End Throughput** - Measure complete system performance with concurrent producers and consumers

**Note**: These benchmarks are for performance testing and should be run in a controlled environment. Always test with production-like data and conditions.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Redis server running (default: localhost:6379)

### Installation

```bash
npm install redis-smq@next redis-smq-common@next redis-smq-benchmarks@next --save
```

## ⚙️ Configuration

Benchmarks can be configured using environment variables:

| Variable              | Description                       | Default    |
|-----------------------|-----------------------------------|------------|
| `BENCH_MESSAGES`      | Total messages to process         | `100000`   |
| `BENCH_PRODUCERS`     | Number of producer worker threads | `0`        |
| `BENCH_CONSUMERS`     | Number of consumer worker threads | `0`        |
| `BENCH_SHOW_PROGRESS` | Benchmark progress reporting      | `0`        |
| `REDIS_HOST`          | Redis server host                 | `localhost` |
| `REDIS_PORT`          | Redis server port                 | `6379`     |
| `REDIS_DB`            | Redis server database             | `0`        |


### Example Configuration

```bash
# Run with custom configuration
REDIS_HOST=127.0.0.1 \
BENCH_PRODUCERS=10 \
BENCH_CONSUMERS=5 \
npx redis-smq-benchmarks
```

## 📈 Benchmark Types

### 1. Producer Throughput Benchmark

Measures how quickly producers can enqueue messages.

**Features:**

- Even distribution of messages across producers
- Real-time progress reporting
- Individual producer statistics
- Aggregate throughput calculation

**Usage:**

```bash
BENCH_MESSAGES=50000 BENCH_PRODUCERS=4 npx redis-smq-benchmarks
```

### 2. Consumer Throughput Benchmark

Measures how quickly consumers can process messages.

**Features:**

- Pre-fills queue with messages
- Even distribution across consumers
- Individual consumer statistics
- Complete consumption tracking

**Usage:**

```bash
BENCH_MESSAGES=50000 BENCH_CONSUMERS=4 npx redis-smq-benchmarks
```

### 3. End-to-End Throughput Benchmark

Measures complete system performance with concurrent producers and consumers.

**Features:**

- Concurrent producer and consumer execution
- Production vs consumption phase tracking
- System backlog monitoring
- Complete throughput analysis

**Usage:**

```bash
BENCH_MESSAGES=100000 BENCH_PRODUCERS=8 BENCH_CONSUMERS=8 npx redis-smq-benchmarks
```

## 📊 Output Metrics

Each benchmark provides detailed metrics:

### Individual Worker Metrics

- Messages processed per worker
- Time taken per worker
- Throughput per worker (messages/second)

### Aggregate Metrics

- Total messages processed
- Total time elapsed
- Overall throughput
- Average time per worker

### E2E-Specific Metrics

- Production throughput
- Consumption throughput
- System backlog (produced vs consumed)
- End-to-end latency

## 📊 Sample Output

```
Starting end-to-end throughput benchmark...
Queue: benchmarking/queue-1767808640925 | Messages: 100000 | Producers: 10 | Consumers: 5
Setting up producers and consumers...

========== E2E BENCHMARK COMPLETE ==========
Production Phase:
  Total produced: 100000
  Production time: 3.35s
  Production throughput: 29824 msg/s

Consumption Phase:
  Total consumed: 100000
  Consumption time: 6.37s
  Consumption throughput: 15689 msg/s

End-to-End:
  Total time: 6.37s
  Overall throughput: 15689 msg/s
  System backlog: 0 messages
  Status: All messages processed successfully ✓
============================================
```

## 🏗️ Architecture

### Design Principles

1. **Worker-Based Architecture**: Each producer/consumer runs in its own worker thread
2. **Even Distribution**: Messages are evenly distributed across all workers
3. **Real-time Monitoring**: Progress updates during execution
4. **Graceful Shutdown**: Clean termination of all resources
5. **Extensible**: Easy to add new benchmark types

## Performance Tuning Tips

1. **Worker Count**: Increase worker count to leverage multi-core CPUs
3. **Redis Configuration**: Ensure Redis has sufficient memory and connection limits
4. **Network**: Local Redis provides the best performance. Network latency impacts throughput

## 📊 Interpreting Results

### Key Metrics to Monitor

1. **Throughput Plateau**: Point where adding more workers doesn't increase throughput
2. **CPU Utilization**: Monitor CPU usage during benchmarks
3. **Memory Usage**: Watch for memory leaks in long-running tests

## License

RedisSMQ Benchmarks is released under the [MIT License](https://github.com/weyoss/redis-smq/tree/next/LICENSE).