/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../../async/index.js';

export interface IHeartbeatPayload<T = unknown> {
  timestamp: number;
  componentId: string;
  componentType: string;
  data: T;
}

export interface IHeartbeatConfig {
  componentId: string;
  componentType: string;
  heartbeatKey: string;
  heartbeatTTL?: number;
}

export type THeartbeatDataFn<T> = (cb: ICallback<T>) => void;

export type THeartbeatEvent<T> = {
  'heartbeat.beat': (
    componentId: string,
    componentType: string,
    timestamp: number,
    payload: IHeartbeatPayload<T>,
  ) => void;
  'heartbeat.error': (
    err: Error,
    componentId: string,
    componentType: string,
  ) => void;
  'heartbeat.goingDown': (componentId: string, componentType: string) => void;
  'heartbeat.down': (componentId: string, componentType: string) => void;
  'heartbeat.goingUp': (componentId: string, componentType: string) => void;
  'heartbeat.up': (componentId: string, componentType: string) => void;
};
