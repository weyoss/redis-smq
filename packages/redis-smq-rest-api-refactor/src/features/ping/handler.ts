/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { Controller, RequestInput } from '../../http/index.js';

/**
 * Response body of the ping endpoint. Kept as a named interface (rather
 * than inline) so a `PingControllerResponseDTO.ts` can be added later
 * without touching the handler — the DTO type would simply alias this
 * one or repeat its shape.
 */
export interface PingResponse {
  ok: true;
  /** Process uptime in seconds, as returned by `process.uptime()`. */
  uptime: number;
}

/**
 * Trivial liveness endpoint.
 *
 * Returns `[200, { ok: true, uptime }]`. It exists to prove the request
 * pipeline works end-to-end (route → handler → envelope → response)
 * without requiring any redis-smq dependency. It reads no `deps` field
 * — the handler is a pure function of the clock.
 *
 * The handler test asserts this by passing a `Deps` proxy that throws
 * on any property access. If a future change makes the handler reach
 * for `deps.logger` or any manager, that test fails loudly.
 */
export const ping: Controller<RequestInput, PingResponse> = async () => {
  return [200, { ok: true, uptime: process.uptime() }] as const;
};
