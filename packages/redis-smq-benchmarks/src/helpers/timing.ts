/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export class HighResTimer {
  static now(): number {
    // Node.js high-resolution time in nanoseconds
    const [seconds, nanoseconds] = process.hrtime();
    return seconds * 1e9 + nanoseconds;
  }

  static since(start: number): number {
    const now = this.now();
    return now - start;
  }

  static toMicroseconds(ns: number): number {
    return ns / 1000;
  }

  static toMilliseconds(ns: number): number {
    return ns / 1e6;
  }

  static toSeconds(ns: number): number {
    return ns / 1e9;
  }

  static format(ns: number): string {
    if (ns < 1000) return `${ns.toFixed(0)}ns`;
    if (ns < 1e6) return `${(ns / 1000).toFixed(2)}µs`;
    if (ns < 1e9) return `${(ns / 1e6).toFixed(2)}ms`;
    return `${(ns / 1e9).toFixed(2)}s`;
  }
}
