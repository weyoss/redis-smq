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
import { EWorkerThreadMessageCodeExit } from '../../../src/lib/consumer/message-handler/consume-message-worker-thread';

it('ConsumeMessageWorker: case 8', async () => {
  const mockParentPort: EventEmitter & { postMessage?: () => void } =
    new EventEmitter();
  mockParentPort.postMessage = jest.fn();

  jest.mock('worker_threads', () => {
    return {
      isMainThread: false,
      parentPort: mockParentPort,
      workerData: '',
    };
  });

  // eslint-disable-next-line
  // @ts-ignore
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

  await import(
    '../../../src/lib/consumer/message-handler/consume-message-worker-thread'
  );

  await delay(5000);

  // In real world the thread would exit when workerData is empty
  // But process.exit is mocked so getHandlerFn() is called with empty workerData
  expect(mockParentPort.postMessage).toHaveBeenCalledTimes(2);
  expect(mockParentPort.postMessage).toHaveBeenNthCalledWith(1, {
    code: EWorkerThreadMessageCodeExit.WORKER_DATA_REQUIRED,
    error: null,
  });
  expect(mockParentPort.postMessage).toHaveBeenNthCalledWith(2, {
    code: EWorkerThreadMessageCodeExit.INVALID_HANDLER_TYPE,
    error: null,
  });

  // In real world the thread would exit when workerData is empty
  // But process.exit is mocked so getHandlerFn() is called with empty workerData
  expect(mockExit).toHaveBeenCalledTimes(2);
  expect(mockExit).toHaveBeenNthCalledWith(
    1,
    EWorkerThreadMessageCodeExit.WORKER_DATA_REQUIRED,
  );
  expect(mockExit).toHaveBeenNthCalledWith(
    2,
    EWorkerThreadMessageCodeExit.INVALID_HANDLER_TYPE,
  );
});
