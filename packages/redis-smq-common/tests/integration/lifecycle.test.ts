/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { Lifecycle, type TLifecycleState } from '../../src/lifecycle/index.js';

/**
 * Drive a fresh `Lifecycle` into the requested state using only the public
 * API (`goingUp` / `goingDown` / `commit`). No direct field access — the
 * state machine is exercised exactly the way a consumer exercises it.
 */
function lifecycleIn(state: TLifecycleState): Lifecycle {
  const sw = new Lifecycle();
  switch (state) {
    case 'DOWN':
      return sw;
    case 'GOING_UP':
      sw.goingUp();
      return sw;
    case 'UP':
      sw.goingUp();
      sw.commit();
      return sw;
    case 'GOING_DOWN':
    default:
      sw.goingUp();
      sw.commit();
      sw.goingDown();
      return sw;
  }
}

describe('Lifecycle', () => {
  // ═════════════════════════════════════════════════════════════════════════
  // Initial state
  // ═════════════════════════════════════════════════════════════════════════

  describe('initial state', () => {
    it('starts in DOWN', () => {
      const sw = new Lifecycle();
      expect(sw.isDown()).toBe(true);
      expect(sw.isUp()).toBe(false);
      expect(sw.isRunning()).toBe(false);
    });

    it('has no pending transition', () => {
      const sw = new Lifecycle();
      expect(sw.isGoingUp()).toBe(false);
      expect(sw.isGoingDown()).toBe(false);
    });

    it('rejects goingDown() from DOWN', () => {
      expect(new Lifecycle().goingDown()).toBe(false);
    });

    it('rejects commit() from DOWN', () => {
      expect(new Lifecycle().commit()).toBe(false);
    });

    it('rejects rollback() from DOWN', () => {
      expect(new Lifecycle().rollback()).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // goingUp()
  // ═════════════════════════════════════════════════════════════════════════

  describe('goingUp()', () => {
    it.each([
      ['DOWN', true],
      ['GOING_UP', false],
      ['UP', false],
      ['GOING_DOWN', false],
    ] as const)('from %s returns %s', (from, expected) => {
      expect(lifecycleIn(from).goingUp()).toBe(expected);
    });

    it('transitions DOWN → GOING_UP when accepted', () => {
      const sw = new Lifecycle();
      expect(sw.goingUp()).toBe(true);
      expect(sw.isGoingUp()).toBe(true);
      expect(sw.isDown()).toBe(true); // still down until commit
      expect(sw.isUp()).toBe(false);
    });

    it('leaves UP state unchanged when rejected', () => {
      const sw = lifecycleIn('UP');
      expect(sw.goingUp()).toBe(false);
      expect(sw.isRunning()).toBe(true);
      expect(sw.isGoingUp()).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // goingDown()
  // ═════════════════════════════════════════════════════════════════════════

  describe('goingDown()', () => {
    it.each([
      ['DOWN', false],
      ['GOING_UP', false],
      ['UP', true],
      ['GOING_DOWN', false],
    ] as const)('from %s returns %s', (from, expected) => {
      expect(lifecycleIn(from).goingDown()).toBe(expected);
    });

    it('transitions UP → GOING_DOWN when accepted', () => {
      const sw = lifecycleIn('UP');
      expect(sw.goingDown()).toBe(true);
      expect(sw.isGoingDown()).toBe(true);
      expect(sw.isUp()).toBe(true); // still up until commit
      expect(sw.isRunning()).toBe(false); // ← no longer accepting new work
    });

    it('leaves DOWN state unchanged when rejected', () => {
      const sw = lifecycleIn('DOWN');
      expect(sw.goingDown()).toBe(false);
      expect(sw.isDown()).toBe(true);
      expect(sw.isGoingDown()).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // commit()
  // ═════════════════════════════════════════════════════════════════════════

  describe('commit()', () => {
    it.each([
      ['DOWN', false],
      ['GOING_UP', true],
      ['UP', false],
      ['GOING_DOWN', true],
    ] as const)('from %s returns %s', (from, expected) => {
      expect(lifecycleIn(from).commit()).toBe(expected);
    });

    it('applies GOING_UP → UP', () => {
      const sw = lifecycleIn('GOING_UP');
      expect(sw.commit()).toBe(true);
      expect(sw.isUp()).toBe(true);
      expect(sw.isRunning()).toBe(true);
      expect(sw.isGoingUp()).toBe(false);
    });

    it('applies GOING_DOWN → DOWN', () => {
      const sw = lifecycleIn('GOING_DOWN');
      expect(sw.commit()).toBe(true);
      expect(sw.isDown()).toBe(true);
      expect(sw.isGoingDown()).toBe(false);
      expect(sw.isRunning()).toBe(false);
    });

    it('returns false on a second commit after a successful one', () => {
      const sw = lifecycleIn('GOING_UP');
      expect(sw.commit()).toBe(true);
      expect(sw.commit()).toBe(false);
    });

    it('leaves UP unchanged when rejected', () => {
      const sw = lifecycleIn('UP');
      expect(sw.commit()).toBe(false);
      expect(sw.isRunning()).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // rollback() — asymmetric by design
  // ═════════════════════════════════════════════════════════════════════════

  describe('rollback()', () => {
    it.each([
      ['DOWN', false],
      ['GOING_UP', true],
      ['UP', false],
      ['GOING_DOWN', false],
    ] as const)('from %s returns %s', (from, expected) => {
      expect(lifecycleIn(from).rollback()).toBe(expected);
    });

    it('applies GOING_UP → DOWN (retryable startup abort)', () => {
      const sw = lifecycleIn('GOING_UP');
      expect(sw.rollback()).toBe(true);
      expect(sw.isDown()).toBe(true);
      expect(sw.isGoingUp()).toBe(false);
    });

    it('rejects rollback from GOING_DOWN and leaves state unchanged', () => {
      // The core asymmetry: shutdown is one-way. Once goingDown() has
      // been called, consumers have been told to stop sending work.
      // Cancelling the transition would strand in-flight work and
      // violate ordering guarantees.
      const sw = lifecycleIn('GOING_DOWN');
      expect(sw.rollback()).toBe(false);
      expect(sw.isGoingDown()).toBe(true); // ← unchanged
      expect(sw.isUp()).toBe(true); // still transitioning from up
      expect(sw.isRunning()).toBe(false); // still in the shutdown window
    });

    it('shutdown failure path — commit() is the only way forward from GOING_DOWN', () => {
      const sw = lifecycleIn('GOING_DOWN');
      // Simulate a failed shutdown step: the caller cannot roll back,
      // must commit anyway (force down).
      expect(sw.rollback()).toBe(false);
      expect(sw.commit()).toBe(true);
      expect(sw.isDown()).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // Query matrix
  // ═════════════════════════════════════════════════════════════════════════

  describe('queries', () => {
    const matrix = [
      // state          isUp   isDown isGoingUp isGoingDown isRunning
      ['DOWN', false, true, false, false, false],
      ['GOING_UP', false, true, true, false, false],
      ['UP', true, false, false, false, true],
      ['GOING_DOWN', true, false, false, true, false],
    ] as const;

    it.each(matrix)(
      '%s — isUp=%s isDown=%s isGoingUp=%s isGoingDown=%s isRunning=%s',
      (state, isUp, isDown, isGoingUp, isGoingDown, isRunning) => {
        const sw = lifecycleIn(state);
        expect(sw.isUp()).toBe(isUp);
        expect(sw.isDown()).toBe(isDown);
        expect(sw.isGoingUp()).toBe(isGoingUp);
        expect(sw.isGoingDown()).toBe(isGoingDown);
        expect(sw.isRunning()).toBe(isRunning);
      },
    );
  });

  // ═════════════════════════════════════════════════════════════════════════
  // isRunning() vs isUp() — the divergence that motivated the rewrite
  // ═════════════════════════════════════════════════════════════════════════

  describe('isRunning() vs isUp()', () => {
    it('both return false in DOWN and GOING_UP', () => {
      expect(lifecycleIn('DOWN').isUp()).toBe(false);
      expect(lifecycleIn('DOWN').isRunning()).toBe(false);
      expect(lifecycleIn('GOING_UP').isUp()).toBe(false);
      expect(lifecycleIn('GOING_UP').isRunning()).toBe(false);
    });

    it('both return true in UP (the stable running state)', () => {
      const sw = lifecycleIn('UP');
      expect(sw.isUp()).toBe(true);
      expect(sw.isRunning()).toBe(true);
    });

    it('diverge in GOING_DOWN — isUp true, isRunning false', () => {
      // This is the shutdown window. Consumers gating on isRunning()
      // reject new work the moment goingDown() is called. Consumers
      // gating on isUp() would continue accepting work until commit()
      // — during which the shutdown may complete and drop the work.
      const sw = lifecycleIn('GOING_DOWN');
      expect(sw.isUp()).toBe(true);
      expect(sw.isRunning()).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // Happy path
  // ═════════════════════════════════════════════════════════════════════════

  describe('happy path', () => {
    it('walks DOWN → GOING_UP → UP → GOING_DOWN → DOWN', () => {
      const sw = new Lifecycle();

      expect(sw.isDown()).toBe(true);

      expect(sw.goingUp()).toBe(true);
      expect(sw.isGoingUp()).toBe(true);
      expect(sw.isRunning()).toBe(false);

      expect(sw.commit()).toBe(true);
      expect(sw.isUp()).toBe(true);
      expect(sw.isRunning()).toBe(true);

      expect(sw.goingDown()).toBe(true);
      expect(sw.isGoingDown()).toBe(true);
      expect(sw.isUp()).toBe(true); // still up
      expect(sw.isRunning()).toBe(false); // but not running

      expect(sw.commit()).toBe(true);
      expect(sw.isDown()).toBe(true);
      expect(sw.isRunning()).toBe(false);
    });

    it('can start a new cycle after completing one', () => {
      const sw = new Lifecycle();

      sw.goingUp();
      sw.commit();
      sw.goingDown();
      sw.commit();
      expect(sw.isDown()).toBe(true);

      expect(sw.goingUp()).toBe(true);
      expect(sw.isGoingUp()).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // Retry after rollback
  // ═════════════════════════════════════════════════════════════════════════

  describe('retry after rollback', () => {
    it('allows a fresh goingUp() immediately after rollback', () => {
      // Startup failure scenario: init fails, rollback returns to DOWN,
      // a second goingUp() succeeds.
      const sw = new Lifecycle();

      expect(sw.goingUp()).toBe(true);
      expect(sw.isGoingUp()).toBe(true);

      expect(sw.rollback()).toBe(true);
      expect(sw.isDown()).toBe(true);

      expect(sw.goingUp()).toBe(true);
      expect(sw.isGoingUp()).toBe(true);
      expect(sw.commit()).toBe(true);
      expect(sw.isRunning()).toBe(true);
    });

    it('supports multiple rollbacks in a row', () => {
      const sw = new Lifecycle();

      for (let i = 0; i < 3; i++) {
        expect(sw.goingUp()).toBe(true);
        expect(sw.rollback()).toBe(true);
        expect(sw.isDown()).toBe(true);
      }

      expect(sw.goingUp()).toBe(true);
      expect(sw.commit()).toBe(true);
      expect(sw.isRunning()).toBe(true);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════
  // Concurrency: only one transition at a time
  // ═════════════════════════════════════════════════════════════════════════

  describe('single in-flight transition', () => {
    it('rejects goingDown() while GOING_UP is pending', () => {
      const sw = lifecycleIn('GOING_UP');
      expect(sw.goingDown()).toBe(false);
      expect(sw.isGoingUp()).toBe(true); // unchanged
      expect(sw.isGoingDown()).toBe(false);
    });

    it('rejects goingUp() while GOING_DOWN is pending', () => {
      const sw = lifecycleIn('GOING_DOWN');
      expect(sw.goingUp()).toBe(false);
      expect(sw.isGoingDown()).toBe(true); // unchanged
      expect(sw.isGoingUp()).toBe(false);
    });

    it('rejects duplicate goingUp() while GOING_UP is pending', () => {
      const sw = lifecycleIn('GOING_UP');
      expect(sw.goingUp()).toBe(false);
      expect(sw.isGoingUp()).toBe(true);
    });

    it('rejects duplicate goingDown() while GOING_DOWN is pending', () => {
      const sw = lifecycleIn('GOING_DOWN');
      expect(sw.goingDown()).toBe(false);
      expect(sw.isGoingDown()).toBe(true);
    });
  });
});
