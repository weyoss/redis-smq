/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueType,
} from 'redis-smq';
import { apiUrl } from '../helpers/context.js';

/**
 * E2E tests for the three endpoints under
 * `/api/namespaces/:ns/queues/:name/state`.
 *
 * Every test starts from a fresh queue in `ACTIVE` state, courtesy of
 * `beforeEach` in the setup file (which flushes Redis between tests).
 * Transitions are exercised in the order they're possible: a queue
 * must be paused before it can be resumed, and the tests respect that
 * by transitioning in the setup where necessary.
 */

const NS = 'app';
const NAME = 'q1';

async function createQueue(ns = NS, name = NAME): Promise<void> {
  const res = await fetch(`${apiUrl()}/api/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queue: { ns, name },
      queueType: EQueueType.LIFO_QUEUE,
      queueDeliveryModel: EQueueDeliveryModel.POINT_TO_POINT,
    }),
  });
  expect(res.status).toBe(201);
}

describe('GET /api/namespaces/:ns/queues/:name/state', () => {
  it('returns the initial state of a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: {
        from: EQueueOperationalState | null;
        to: EQueueOperationalState;
        reason: string;
      };
    };
    expect(data.from).toBeNull();
    expect(data.to).toBe(EQueueOperationalState.ACTIVE);
    expect(data.reason).toBe('SYSTEM_INIT');
  });

  it('returns 400 QueueNotFoundError for an unknown queue', async () => {
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/missing/state`,
    );
    expect(res.status).toBe(400);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueNotFoundError');
  });
});

describe('GET /api/namespaces/:ns/queues/:name/state/history', () => {
  it('returns the initial transition for a fresh queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state/history`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: Array<{ from: null; to: EQueueOperationalState; reason: string }>;
    };
    expect(data).toHaveLength(1);
    expect(data[0]?.from).toBeNull();
    expect(data[0]?.to).toBe(EQueueOperationalState.ACTIVE);
    expect(data[0]?.reason).toBe('SYSTEM_INIT');
  });

  it('records each transition in order', async () => {
    await createQueue();

    // Pause, then resume.
    await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'pause', options: {} }),
    }).then((r) => expect(r.status).toBe(200));

    await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'resume', options: {} }),
    }).then((r) => expect(r.status).toBe(200));

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state/history`,
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: Array<{
        from: EQueueOperationalState | null;
        to: EQueueOperationalState;
      }>;
    };
    expect(data).toHaveLength(3);
    expect(data[0]?.to).toBe(EQueueOperationalState.ACTIVE);
    expect(data[1]?.to).toBe(EQueueOperationalState.PAUSED);
    expect(data[2]?.to).toBe(EQueueOperationalState.ACTIVE);
  });
});

describe('PATCH /api/namespaces/:ns/queues/:name/state', () => {
  it('pauses an active queue and returns the transition', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: 'pause',
          options: { description: 'test pause', metadata: { reason: 'test' } },
        }),
      },
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: {
        from: EQueueOperationalState;
        to: EQueueOperationalState;
        reason: string;
        description?: string;
      };
    };
    expect(data.from).toBe(EQueueOperationalState.ACTIVE);
    expect(data.to).toBe(EQueueOperationalState.PAUSED);
    expect(data.reason).toBe('MANUAL');
    expect(data.description).toBe('test pause');
  });

  it('stops an active queue', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'stop', options: {} }),
      },
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { from: EQueueOperationalState; to: EQueueOperationalState };
    };
    expect(data.from).toBe(EQueueOperationalState.ACTIVE);
    expect(data.to).toBe(EQueueOperationalState.STOPPED);
  });

  it('resumes a paused queue', async () => {
    await createQueue();

    // Pause first — resume is only valid from PAUSED.
    await fetch(`${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: 'pause', options: {} }),
    });

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'resume', options: {} }),
      },
    );
    expect(res.status).toBe(200);

    const { data } = (await res.json()) as {
      data: { from: EQueueOperationalState; to: EQueueOperationalState };
    };
    expect(data.from).toBe(EQueueOperationalState.PAUSED);
    expect(data.to).toBe(EQueueOperationalState.ACTIVE);
  });

  it('rejects an unknown state value with 400 RequestValidationError', async () => {
    await createQueue();

    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'explode', options: {} }),
      },
    );
    expect(res.status).toBe(400);

    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('RequestValidationError');
  });

  it('rejects an invalid transition with 422 QueueStateTransitionError', async () => {
    await createQueue();

    // Resume on an ACTIVE queue is not a legal transition. The
    // library rejects it; the handler doesn't pre-check.
    const res = await fetch(
      `${apiUrl()}/api/namespaces/${NS}/queues/${NAME}/state`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: 'resume', options: {} }),
      },
    );

    // Confirm the exact status and error name — the library defines
    // what "not legal" means, and the map defines the status.
    expect(res.status).toBe(422);
    const { error } = (await res.json()) as { error: { message: string } };
    expect(error.message).toBe('QueueStateTransitionError');
  });
});
