/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * The set of message-statuses the browse endpoints accept in their
 * `status` query parameter.
 *
 * Defined in its own file, separate from `message-browser.ts`, so the
 * DTOs that reference it don't transitively pull in `deps/index.js`
 * and its `redis-smq` imports. The schema generator's program stays
 * small; this type is a plain string-literal union with no upstream
 * dependencies.
 */
export type MessageStatus =
  'pending' | 'acknowledged' | 'dead-lettered' | 'scheduled' | 'published';
