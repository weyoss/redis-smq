/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export class PowerSwitch {
  protected isPowered = false;
  protected pendingState: boolean | null = null;

  protected switch(s: boolean): boolean {
    if (this.pendingState !== null) {
      // Can not switch state while another state transition is in progress
      return false;
    }

    if (s === this.isPowered) {
      // Can not switch to the same current state
      return false;
    }

    this.pendingState = s;
    return true;
  }

  isUp(): boolean {
    return this.isPowered;
  }

  isDown(): boolean {
    return !this.isPowered;
  }

  isGoingUp(): boolean {
    return this.pendingState === true;
  }

  isGoingDown(): boolean {
    return this.pendingState === false;
  }

  isRunning(): boolean {
    return this.isUp() && this.pendingState === null;
  }

  goingUp(): boolean {
    return this.switch(true);
  }

  goingDown(): boolean {
    return this.switch(false);
  }

  commit(): boolean {
    if (this.pendingState === null) {
      // Expected a pending state
      return false;
    }
    this.isPowered = this.pendingState;
    this.pendingState = null;
    return true;
  }

  rollback(): boolean {
    if (this.pendingState === null) {
      // Expected a pending state
      return false;
    }
    this.pendingState = null;
    return true;
  }
}
