/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { APIRequestContext } from '@playwright/test';
import type {
  DeliveryModel,
  ExchangeQueuePolicy,
  ExchangeType,
  QueueType,
} from '../helpers/constants.js';

export interface QueueRef {
  ns: string;
  name: string;
}

export interface ExchangeRef extends QueueRef {
  type: ExchangeType;
}

export interface PurgeJob {
  id: string;
  status: number;
  createdAt: number;
  completedAt?: number;
  startedAt?: number;
  updatedAt?: number;
  error?: string;
  meta: { purged: number };
}

type ApiResponse<T> = { data: T };

export function apiClient(request: APIRequestContext, apiUrl: string) {
  const base = apiUrl.replace(/\/+$/, '');

  async function assertOk(
    res: Awaited<ReturnType<APIRequestContext['get']>>,
    label: string,
  ): Promise<void> {
    if (!res.ok()) {
      const body = await res.text().catch(() => '<no body>');
      throw new Error(
        `[api] ${label} failed: HTTP ${res.status()} ${res.url()}\n${body}`,
      );
    }
  }

  async function json<T>(
    res: Awaited<ReturnType<APIRequestContext['get']>>,
    label: string,
  ): Promise<T> {
    await assertOk(res, label);
    return (await res.json()) as T;
  }

  const url = (path: string) => `${base}${path}`;

  return {
    /** GET /api/ping — surfaces early when the API isn't up. */
    async ping(): Promise<{ ok: true; uptime: number }> {
      const res = await request.get(url('/api/ping'));
      return (
        await json<ApiResponse<{ ok: true; uptime: number }>>(res, 'ping')
      ).data;
    },

    /** POST /api/queues */
    async createQueue(
      queue: QueueRef,
      opts: {
        queueType?: QueueType;
        queueDeliveryModel?: DeliveryModel;
      } = {},
    ): Promise<void> {
      const res = await request.post(url('/api/queues'), {
        data: {
          queue,
          queueType: opts.queueType ?? 1,
          queueDeliveryModel: opts.queueDeliveryModel ?? 0,
        },
      });
      await assertOk(res, `createQueue ${queue.ns}/${queue.name}`);
    },

    /** DELETE /api/namespaces/:ns/queues/:name */
    async deleteQueue(queue: QueueRef): Promise<void> {
      const res = await request.delete(
        url(`/api/namespaces/${queue.ns}/queues/${queue.name}`),
      );
      await assertOk(res, `deleteQueue ${queue.ns}/${queue.name}`);
    },

    /** GET /api/namespaces/:ns/queues/:name */
    async getQueueProperties(
      queue: QueueRef,
    ): Promise<Record<string, unknown>> {
      const res = await request.get(
        url(`/api/namespaces/${queue.ns}/queues/${queue.name}`),
      );
      return (
        await json<ApiResponse<Record<string, unknown>>>(
          res,
          'getQueueProperties',
        )
      ).data;
    },

    /** POST /api/messages */
    async publishMessage(body: unknown): Promise<{ ids: string[] }> {
      const res = await request.post(url('/api/messages'), { data: body });
      const data = await json<ApiResponse<string[]>>(res, 'publishMessage');
      return { ids: data.data };
    },

    /** POST /api/exchanges */
    async createExchange(
      exchange: QueueRef,
      opts: {
        type: ExchangeType;
        queuePolicy?: ExchangeQueuePolicy;
      },
    ): Promise<void> {
      const res = await request.post(url('/api/exchanges'), {
        data: {
          exchange,
          type: opts.type,
          queuePolicy: opts.queuePolicy ?? 0,
        },
      });
      await assertOk(res, `createExchange ${exchange.ns}/${exchange.name}`);
    },

    /** DELETE /api/namespaces/:ns/exchanges/:exchange */
    async deleteExchange(exchange: QueueRef): Promise<void> {
      const res = await request.delete(
        url(`/api/namespaces/${exchange.ns}/exchanges/${exchange.name}`),
      );
      await assertOk(res, `deleteExchange ${exchange.ns}/${exchange.name}`);
    },

    /** POST /api/namespaces/:ns/exchanges/:exchange/bindings/:queue */
    async bindQueue(
      ns: string,
      exchange: string,
      queue: string,
      params: { routingKey?: string; routingPattern?: string } = {},
    ): Promise<void> {
      const res = await request.post(
        url(`/api/namespaces/${ns}/exchanges/${exchange}/bindings/${queue}`),
        { params },
      );
      await assertOk(res, `bindQueue ${ns}/${exchange}/${queue}`);
    },

    /** POST /api/namespaces/:ns/queues/:name/consumer-groups */
    async createConsumerGroup(
      queue: QueueRef,
      consumerGroupId: string,
    ): Promise<void> {
      const res = await request.post(
        url(`/api/namespaces/${queue.ns}/queues/${queue.name}/consumer-groups`),
        { data: { consumerGroupId } },
      );
      await assertOk(res, `createConsumerGroup ${consumerGroupId}`);
    },

    /** PATCH /api/namespaces/:ns/queues/:name/state — pause/resume/stop. */
    async pauseQueue(queue: QueueRef): Promise<void> {
      const res = await request.patch(
        url(`/api/namespaces/${queue.ns}/queues/${queue.name}/state`),
        { data: { state: 'pause', options: { reason: 'MANUAL' } } },
      );
      await assertOk(res, `pauseQueue ${queue.ns}/${queue.name}`);
    },

    /** PUT /api/namespaces/:ns/queues/:name/rate-limit */
    async setRateLimit(
      queue: QueueRef,
      body: { limit: number; interval: number },
    ): Promise<void> {
      const res = await request.put(
        url(`/api/namespaces/${queue.ns}/queues/${queue.name}/rate-limit`),
        { data: body },
      );
      await assertOk(res, `setRateLimit ${queue.ns}/${queue.name}`);
    },

    /** DELETE /api/namespaces/:ns/queues/:name/purge/:status — 202 + jobId */
    async startPurge(
      queue: QueueRef,
      status: string,
    ): Promise<{ jobId: string }> {
      const res = await request.delete(
        url(`/api/namespaces/${queue.ns}/queues/${queue.name}/purge/${status}`),
      );
      const data = await json<ApiResponse<{ jobId: string }>>(
        res,
        'startPurge',
      );
      return data.data;
    },

    /** GET /api/namespaces/:ns/queues/:name/purge/:status/:jobId */
    async getPurgeJob(
      queue: QueueRef,
      status: string,
      jobId: string,
    ): Promise<PurgeJob> {
      const res = await request.get(
        url(
          `/api/namespaces/${queue.ns}/queues/${queue.name}/purge/${status}/${jobId}`,
        ),
      );
      return (await json<ApiResponse<PurgeJob>>(res, 'getPurgeJob')).data;
    },

    /**
     * Poll until the job reaches any terminal state. `completedAt` is set
     * exactly once the job ends — more robust than hard-coding
     * EBackgroundJobStatus numeric values (the spec doesn't name them).
     */
    async waitForPurgeComplete(
      queue: QueueRef,
      status: string,
      jobId: string,
      timeoutMs = 30_000,
    ): Promise<PurgeJob> {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const job = await this.getPurgeJob(queue, status, jobId);
        if (job.completedAt !== undefined) return job;
        await new Promise((r) => setTimeout(r, 200));
      }
      throw new Error(
        `[api] Purge job ${jobId} did not complete within ${timeoutMs}ms`,
      );
    },

    /** Convenience: start a purge and wait for it to finish. */
    async purgeAllMessages(queue: QueueRef): Promise<PurgeJob> {
      const { jobId } = await this.startPurge(queue, 'published');
      return this.waitForPurgeComplete(queue, 'published', jobId);
    },

    /**
     * GET /api/config — returns the fully-parsed `IRedisSMQParsedConfig`.
     * Typed as `unknown` at the boundary so callers can round-trip it
     * through `updateConfiguration` without fighting the union
     * narrowing between `IRedisSMQConfig` (input) and
     * `IRedisSMQParsedConfig` (output). The parsed form is a strict
     * subset of the input form (booleans replaced by their nested
     * `{ enabled: boolean, ... }` variants, which the input schema
     * also accepts).
     */
    async getConfiguration(): Promise<unknown> {
      const res = await request.get(url('/api/config'));
      return (await json<ApiResponse<unknown>>(res, 'getConfiguration')).data;
    },

    /**
     * PATCH /api/config — deep-merges the partial over the existing
     * config. Sending the full parsed config back is a valid restore
     * operation: every leaf overwrites its previous value.
     */
    async updateConfiguration(data: unknown): Promise<void> {
      const res = await request.patch(url('/api/config'), { data });
      await assertOk(res, 'updateConfiguration');
    },
  };
}
