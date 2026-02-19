/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { PowerSwitch } from 'redis-smq-common';

export class StateManager {
  private static state = new PowerSwitch();

  /**
   * Check if RedisSMQ is fully up and running
   */
  static isUp(): boolean {
    return this.state.isUp();
  }

  /**
   * Check if RedisSMQ is in the process of starting up
   */
  static isGoingUp(): boolean {
    return this.state.isGoingUp();
  }

  /**
   * Check if RedisSMQ is in the process of shutting down
   */
  static isGoingDown(): boolean {
    return this.state.isGoingDown();
  }

  /**
   * Check if RedisSMQ is currently running (up and not going down)
   */
  static isRunning(): boolean {
    return this.state.isRunning();
  }

  /**
   * Check if RedisSMQ is fully down
   */
  static isDown(): boolean {
    return this.state.isDown();
  }

  /**
   * Transition to "going up" state (starting)
   */
  static goingUp(): void {
    this.state.goingUp();
  }

  /**
   * Transition to "going down" state (stopping)
   */
  static goingDown(): void {
    this.state.goingDown();
  }

  /**
   * Commit the current transition (complete startup or shutdown)
   */
  static commit(): void {
    this.state.commit();
  }

  /**
   * Rollback the current transition (cancel startup or shutdown)
   */
  static rollback(): void {
    this.state.rollback();
  }
}
