/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import * as crypto from 'crypto';
import os from 'node:os';
import {
  IBaselineEntry,
  ICPUMeasureSnapshot,
  ICPUMonitorOptions,
  ICPUUsage,
} from './types/index.js';

export class CPUMonitor {
  private static instance: CPUMonitor | null = null;

  private readonly baselines = new Map<string, IBaselineEntry>();
  private readonly maxBaselineAgeMs: number;
  private readonly precision: number;

  protected constructor(options: ICPUMonitorOptions = {}) {
    this.maxBaselineAgeMs = options.maxBaselineAgeMs ?? 300_000; // 5 minutes
    this.precision = Math.max(0, Math.min(3, options.precision ?? 2));
  }

  /** Singleton – first call sets the options, later calls ignore them */
  public static getInstance(options: ICPUMonitorOptions = {}): CPUMonitor {
    if (!CPUMonitor.instance) {
      CPUMonitor.instance = new CPUMonitor(options);
    }
    return CPUMonitor.instance;
  }

  /**
   * Clean up any baselines older than `maxBaselineAgeMs`.
   * Called automatically on every measurement (getStats / getStatsOverInterval).
   */
  private cleanupOldBaselines(): void {
    const now = Date.now();
    const cutoff = now - this.maxBaselineAgeMs;

    for (const [callerId, entry] of this.baselines) {
      if (entry.timestamp < cutoff) {
        this.baselines.delete(callerId);
      }
    }
  }

  /** Take a fresh snapshot of system-wide CPU counters */
  private takeSnapshot(): ICPUMeasureSnapshot {
    const cpus = os.cpus();
    if (!cpus.length) {
      throw new Error('No CPU information available');
    }

    let totalUser = 0;
    let totalSystem = 0;
    let totalIdle = 0;
    let totalAll = 0;

    cpus.forEach((cpu) => {
      totalUser += cpu.times.user;
      totalSystem += cpu.times.sys;
      totalIdle += cpu.times.idle;
      totalAll +=
        cpu.times.user +
        cpu.times.nice +
        cpu.times.sys +
        cpu.times.idle +
        cpu.times.irq;
    });

    return {
      user: totalUser,
      system: totalSystem,
      idle: totalIdle,
      total: totalAll,
      timestamp: Date.now(),
    } as const;
  }

  /** Calculate delta usage between two snapshots */
  private calculateUsage(
    start: ICPUMeasureSnapshot,
    end: ICPUMeasureSnapshot,
  ): ICPUUsage {
    if (end.timestamp <= start.timestamp) {
      return { user: 0, system: 0, percentage: '0%' };
    }

    const userDiff = Math.max(0, end.user - start.user);
    const systemDiff = Math.max(0, end.system - start.system);
    const totalDiff = Math.max(0, end.total - start.total);

    if (totalDiff === 0) {
      return { user: 0, system: 0, percentage: '0%' };
    }

    const userPct = (userDiff / totalDiff) * 100;
    const systemPct = (systemDiff / totalDiff) * 100;
    const totalPct = Math.min(100, userPct + systemPct);

    const factor = 10 ** this.precision;

    return {
      user: Math.round(userPct * factor) / factor,
      system: Math.round(systemPct * factor) / factor,
      percentage: Math.round(totalPct) + '%',
    } as const;
  }

  /**
   * Get current system-wide CPU usage for a given caller.
   * Baselines older than maxBaselineAgeMs are cleaned up automatically.
   */
  public getStats(callerId: string = 'default'): ICPUUsage {
    this.cleanupOldBaselines();

    const current = this.takeSnapshot();
    const previous = this.baselines.get(callerId);

    if (!previous) {
      this.baselines.set(callerId, {
        snapshot: current,
        timestamp: Date.now(),
      });
      return { user: 0, system: 0, percentage: '0%' };
    }

    const usage = this.calculateUsage(previous.snapshot, current);

    // Update baseline for next call
    this.baselines.set(callerId, { snapshot: current, timestamp: Date.now() });

    return usage;
  }

  /**
   * One-shot measurement over a fixed interval (useful for scripts / tests).
   * Cleans up old baselines before starting.
   */
  public async getStatsOverInterval(
    callerId: string = 'default',
    intervalMs: number = 1000,
  ): Promise<ICPUUsage> {
    this.cleanupOldBaselines(); // ← cleanup on every measurement

    const start = this.takeSnapshot();
    const tempId = `temp-${callerId}-${Date.now()}`;

    this.baselines.set(tempId, { snapshot: start, timestamp: Date.now() });

    await new Promise((resolve) =>
      setTimeout(resolve, Math.max(0, intervalMs)),
    );

    const end = this.takeSnapshot();
    const usage = this.calculateUsage(start, end);

    this.baselines.delete(tempId);
    return usage;
  }

  public generateCallerId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  public removeCaller(callerId: string): boolean {
    return this.baselines.delete(callerId);
  }

  public hasCaller(callerId: string): boolean {
    return this.baselines.has(callerId);
  }

  public getActiveCallerCount(): number {
    this.cleanupOldBaselines();
    return this.baselines.size;
  }

  public getActiveCallers(): readonly string[] {
    this.cleanupOldBaselines();
    return Array.from(this.baselines.keys());
  }

  public getBaselineAge(callerId: string): number | null {
    const entry = this.baselines.get(callerId);
    return entry ? Date.now() - entry.timestamp : null;
  }

  public reset(): void {
    this.baselines.clear();
  }

  public cleanup(): void {
    this.cleanupOldBaselines();
  }

  public getMonitorStats(): {
    readonly activeCallers: number;
    readonly oldestBaseline: number;
    readonly newestBaseline: number;
    readonly totalBaselines: number;
  } {
    this.cleanupOldBaselines();

    let oldest = Date.now();
    let newest = 0;

    for (const entry of this.baselines.values()) {
      oldest = Math.min(oldest, entry.timestamp);
      newest = Math.max(newest, entry.timestamp);
    }

    return {
      activeCallers: this.baselines.size,
      oldestBaseline: oldest === Date.now() ? 0 : oldest,
      newestBaseline: newest,
      totalBaselines: this.baselines.size,
    } as const;
  }

  public getOneTimeStats(): ICPUUsage {
    const id = this.generateCallerId();
    const usage = this.getStats(id);
    this.removeCaller(id);
    return usage;
  }

  public getStatsWithAutoId(): {
    readonly callerId: string;
    readonly usage: ICPUUsage;
    readonly cleanup: () => void;
  } {
    const callerId = this.generateCallerId();
    const usage = this.getStats(callerId);

    return {
      callerId,
      usage,
      cleanup: () => this.removeCaller(callerId),
    } as const;
  }
}
