/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { EQueueType, errors, RedisSMQ } from '../../../src/index.js';
import { createQueue } from '../../helpers/factories/queue.js';

/**
 * Integration tests for namespace management.
 *
 * A namespace is the outermost container in RedisSMQ's hierarchy.
 * A queue belongs to exactly one namespace, and the namespace registry
 * tracks which namespaces have at least one queue.
 *
 * Operations covered here:
 *
 *   - `getNamespaces()` — the list of registered namespace names.
 *   - `getNamespaceQueues(ns)` — the queues belonging to a namespace.
 *   - `delete(ns)` — remove a namespace and everything in it.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a namespace name unique to a test.
 *
 * The prefix identifies which test the namespace belongs to in failure
 * output; the random suffix guarantees uniqueness even if two tests
 * run in the same millisecond. `flushAll` between tests means
 * collisions are not a correctness concern, but unique names make a
 * failure easier to attribute at a glance.
 */
function uniqueNamespace(prefix: string): string {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Namespace management', () => {
  // -------------------------------------------------------------------------
  // Listing
  // -------------------------------------------------------------------------

  describe('listing', () => {
    it('registers a namespace when a queue is created in it', async () => {
      const ns = uniqueNamespace('ns-register');

      await createQueue({ ns, name: 'q' }, EQueueType.FIFO_QUEUE);

      const namespaceManager = RedisSMQ.createNamespaceManager();
      const namespaces = await namespaceManager.getNamespaces();

      expect(namespaces).toContain(ns);
    });

    it('lists multiple coexisting namespaces', async () => {
      const nsA = uniqueNamespace('ns-coexist-a');
      const nsB = uniqueNamespace('ns-coexist-b');

      await createQueue({ ns: nsA, name: 'q' }, EQueueType.FIFO_QUEUE);
      await createQueue({ ns: nsB, name: 'q' }, EQueueType.FIFO_QUEUE);

      const namespaceManager = RedisSMQ.createNamespaceManager();
      const namespaces = await namespaceManager.getNamespaces();

      expect(namespaces).toContain(nsA);
      expect(namespaces).toContain(nsB);
    });

    it('returns only the queues belonging to the given namespace', async () => {
      const nsA = uniqueNamespace('ns-scope-a');
      const nsB = uniqueNamespace('ns-scope-b');

      await createQueue({ ns: nsA, name: 'q1' }, EQueueType.FIFO_QUEUE);
      await createQueue({ ns: nsA, name: 'q2' }, EQueueType.FIFO_QUEUE);
      await createQueue({ ns: nsB, name: 'q1' }, EQueueType.FIFO_QUEUE);

      const namespaceManager = RedisSMQ.createNamespaceManager();

      const queuesA = await namespaceManager.getNamespaceQueues(nsA);
      const queuesB = await namespaceManager.getNamespaceQueues(nsB);

      // Set comparison of queue names, since RedisSMQ does not
      // guarantee the order in which `getNamespaceQueues` returns
      // them.
      expect(new Set(queuesA.map((q) => q.name))).toEqual(
        new Set(['q1', 'q2']),
      );
      expect(new Set(queuesB.map((q) => q.name))).toEqual(new Set(['q1']));

      // Every returned queue carries the namespace that was queried.
      // A regression that returned queues from the wrong namespace
      // would produce a set with the correct names but the wrong `ns`
      // field; this catches it.
      for (const q of queuesA) {
        expect(q.ns).toBe(nsA);
      }
      for (const q of queuesB) {
        expect(q.ns).toBe(nsB);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Deleting
  // -------------------------------------------------------------------------

  describe('deleting', () => {
    it('removes the namespace and its queues', async () => {
      const ns = uniqueNamespace('ns-delete');
      const queueManager = RedisSMQ.createQueueManager();

      await createQueue({ ns, name: 'q1' }, EQueueType.FIFO_QUEUE);
      await createQueue({ ns, name: 'q2' }, EQueueType.FIFO_QUEUE);

      // Confirm the pre-state so the post-state assertions are
      // meaningful — the namespace is registered and both queues are
      // readable.
      await expect(
        queueManager.getProperties({ ns, name: 'q1' }),
      ).resolves.toBeDefined();
      await expect(
        queueManager.getProperties({ ns, name: 'q2' }),
      ).resolves.toBeDefined();

      const namespaceManager = RedisSMQ.createNamespaceManager();
      await namespaceManager.delete(ns);

      // The namespace is no longer listed.
      const namespaces = await namespaceManager.getNamespaces();
      expect(namespaces).not.toContain(ns);

      // Both queues are gone.
      await expect(
        queueManager.getProperties({ ns, name: 'q1' }),
      ).rejects.toThrow(errors.QueueNotFoundError);
      await expect(
        queueManager.getProperties({ ns, name: 'q2' }),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });

    it('does not affect queues in other namespaces', async () => {
      const nsKeep = uniqueNamespace('ns-keep');
      const nsDelete = uniqueNamespace('ns-drop');
      const queueManager = RedisSMQ.createQueueManager();

      await createQueue({ ns: nsKeep, name: 'q' }, EQueueType.FIFO_QUEUE);
      await createQueue({ ns: nsDelete, name: 'q' }, EQueueType.FIFO_QUEUE);

      const namespaceManager = RedisSMQ.createNamespaceManager();
      await namespaceManager.delete(nsDelete);

      // The deleted namespace is gone.
      await expect(
        queueManager.getProperties({ ns: nsDelete, name: 'q' }),
      ).rejects.toThrow(errors.QueueNotFoundError);

      // The other namespace's queue is still readable.
      await expect(
        queueManager.getProperties({ ns: nsKeep, name: 'q' }),
      ).resolves.toBeDefined();

      // The other namespace is still listed.
      const namespaces = await namespaceManager.getNamespaces();
      expect(namespaces).toContain(nsKeep);
      expect(namespaces).not.toContain(nsDelete);
    });

    it('rejects reading a namespace that does not exist', async () => {
      const ns = uniqueNamespace('ns-read-missing');

      await createQueue({ ns, name: 'q' }, EQueueType.FIFO_QUEUE);

      const namespaceManager = RedisSMQ.createNamespaceManager();
      await namespaceManager.delete(ns);

      await expect(namespaceManager.getNamespaceQueues(ns)).rejects.toThrow(
        errors.NamespaceNotFoundError,
      );
    });

    it('rejects a second delete of the same namespace', async () => {
      const ns = uniqueNamespace('ns-delete-twice');

      await createQueue({ ns, name: 'q' }, EQueueType.FIFO_QUEUE);

      const namespaceManager = RedisSMQ.createNamespaceManager();
      await namespaceManager.delete(ns);

      await expect(namespaceManager.delete(ns)).rejects.toThrow(
        errors.NamespaceNotFoundError,
      );
    });
  });
});
