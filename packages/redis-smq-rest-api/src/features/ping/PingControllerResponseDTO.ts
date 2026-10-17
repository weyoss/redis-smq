/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Response shape of `GET /api/ping`.
 *
 * A single 200 branch. The endpoint is a diagnostic; it doesn't have
 * domain errors that reach the wire, and a failure to respond at all
 * is a transport-level failure, not an HTTP one.
 */
export interface PingResponse {
  ok: true;
  uptime: number;
}

export type PingControllerResponseDTO = readonly [200, PingResponse];
