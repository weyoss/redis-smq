/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Information about a consumer, as reported by the consumer itself when
 * it registered for a queue.
 *
 * Reported once, at subscription time, and stored in the queue's consumer
 * hash in Redis. The values are not refreshed while the consumer is
 * subscribed — an IP change or hostname change will not be reflected
 * until the consumer re-registers.
 *
 * Two fields describe the consumer's network location:
 *
 *   - `ipAddress`: every non-internal IPv4 address reported by
 *     `os.networkInterfaces()` at registration time. A host with multiple
 *     NICs or multiple addresses on the same NIC contributes multiple
 *     entries. Empty if the host has no non-internal IPv4 interface,
 *     which is unusual but possible in containerized environments.
 *
 *   - `hostname`: `os.hostname()` at registration time.
 *
 * `pid` and `createdAt` identify the process and the moment of
 * registration. A consumer that crashes and restarts reports a different
 * `createdAt`, so two entries with the same `pid` and `hostname` but
 * different `createdAt` are distinct registrations.
 */
export interface IQueueConsumer {
  /**
   * Every non-internal IPv4 address of the host, as reported by
   * `os.networkInterfaces()` at registration time.
   *
   * An array because a host can have multiple network interfaces, or
   * multiple addresses on one interface. Empty if the host reports no
   * non-internal IPv4 addresses.
   */
  readonly ipAddress: string[];

  /**
   * The host's name, as reported by `os.hostname()` at registration
   * time.
   */
  readonly hostname: string;

  /**
   * The process ID of the consumer that registered.
   *
   * Useful for distinguishing multiple consumers on the same host.
   * Combined with `hostname` and `createdAt`, uniquely identifies a
   * registration within a single Redis instance.
   */
  readonly pid: number;

  /**
   * Milliseconds since the Unix epoch, at the moment the consumer
   * registered.
   *
   * Used by the reaper to identify stale consumers whose heartbeat has
   * expired and whose processing queues need recovery.
   */
  readonly createdAt: number;
}
