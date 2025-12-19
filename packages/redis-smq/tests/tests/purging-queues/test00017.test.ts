/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { QueueNotFoundError } from '../../../src/errors/index.js';
import { getQueueManager } from '../../common/queue-manager.js';

test('Deleting a non-existing message queue', async () => {
  const q = await getQueueManager();
  await expect(q.deleteAsync('my-queue')).rejects.toThrow(QueueNotFoundError);
});
