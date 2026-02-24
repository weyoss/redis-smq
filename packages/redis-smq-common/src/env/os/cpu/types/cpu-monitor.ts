/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export interface ICPUUsage {
  /** User-mode CPU time percentage (includes `nice` time) */
  readonly user: number;
  /** System-mode CPU time percentage (includes `irq`, `softirq`, `steal`) */
  readonly system: number;
  /** Total CPU usage as a string (e.g. "42%") – always rounded to whole number */
  readonly percentage: string;
}

export interface ICPUMeasureSnapshot {
  readonly user: number;
  readonly system: number;
  readonly idle: number;
  readonly total: number;
  readonly timestamp: number;
}

export interface IBaselineEntry {
  readonly snapshot: ICPUMeasureSnapshot;
  readonly timestamp: number;
}

export interface ICPUMonitorOptions {
  /** Maximum age of any baseline before it is considered stale (default: 5 minutes) */
  readonly maxBaselineAgeMs?: number;
  /** Decimal precision for `user` / `system` values (0–3). Default = 2 */
  readonly precision?: number;
}
