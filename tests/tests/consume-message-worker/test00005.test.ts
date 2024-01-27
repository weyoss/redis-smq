/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventEmitter } from 'events';
import { delay } from 'bluebird';
import { EWorkerThreadMessageCodeConsume } from '../../../src/lib/consumer/message-handler/consume-message-worker-thread';

it('ConsumeMessageWorker: case 5', async () => {
  const mockParentPort: EventEmitter & { postMessage?: () => void } =
    new EventEmitter();
  mockParentPort.postMessage = jest.fn();

  jest.mock('worker_threads', () => {
    return {
      isMainThread: false,
      parentPort: mockParentPort,
      workerData: `${__dirname}/../../common/message-handler-worker-unacks-exception.js`,
    };
  });

  // eslint-disable-next-line
  // @ts-ignore
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

  await import(
    '../../../src/lib/consumer/message-handler/consume-message-worker-thread'
  );

  await delay(5000);

  mockParentPort.emit('message', '123456789');

  expect(mockParentPort.postMessage).toHaveBeenCalledTimes(1);
  expect(mockParentPort.postMessage).toHaveBeenCalledWith({
    code: EWorkerThreadMessageCodeConsume.MESSAGE_PROCESSING_CAUGHT_ERROR,
    error: { name: 'Error', message: 'THROW_ERROR' },
  });

  expect(mockExit).toHaveBeenCalledTimes(0);
});
