/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * `@koa/bodyparser` injects `ctx.request.body` at runtime and ships its
 * own type augmentation. Under NodeNext module resolution that
 * augmentation isn't reliably visible to files that don't import the
 * package directly. This declaration restates the property so it's
 * available across the codebase.
 *
 * Typed `unknown` deliberately — a narrower type would lie about the
 * parsed body's shape. Route schemas narrow it further via AJV.
 */
import 'koa';

declare module 'koa' {
  interface Request {
    body?: unknown;
  }
}
