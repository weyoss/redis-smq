/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { PowerSwitch } from '../../src/power-switch/index.js';

describe('PowerSwitch', () => {
  it('starts in the down state', () => {
    const powerSwitch = new PowerSwitch();

    expect(powerSwitch.isDown()).toBe(true);
    expect(powerSwitch.isRunning()).toBe(false);
  });

  it('transitions Down → Up through goingUp() + commit()', () => {
    const powerSwitch = new PowerSwitch();

    // goingUp() is accepted once; subsequent goingUp() returns false.
    expect(powerSwitch.goingUp()).toBe(true);
    expect(powerSwitch.goingUp()).toBe(false);

    // commit() applies the transition; further commits are no-ops.
    expect(powerSwitch.commit()).toBe(true);
    expect(powerSwitch.commit()).toBe(false);
    expect(powerSwitch.goingUp()).toBe(false);
  });

  it('transitions Up → Down through goingDown() + commit()', () => {
    const powerSwitch = new PowerSwitch();

    powerSwitch.goingUp();
    powerSwitch.commit();

    expect(powerSwitch.goingDown()).toBe(true);
    expect(powerSwitch.goingDown()).toBe(false);

    expect(powerSwitch.commit()).toBe(true);
    expect(powerSwitch.commit()).toBe(false);
    expect(powerSwitch.goingDown()).toBe(false);
  });
});
