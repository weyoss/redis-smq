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
import { EWorkerThreadMessageCodeExit } from '../../../types';

it('ConsumeMessageWorker: case 7', async () => {
  const mockParentPort: EventEmitter & { postMessage?: () => void } =
    new EventEmitter();
  mockParentPort.postMessage = jest.fn();

  jest.mock('worker_threads', () => {
    return {
      isMainThread: false,
      parentPort: mockParentPort,
      workerData: `${__dirname}/../../common/message-handler-worker-faulty-exit.js`,
    };
  });

  // eslint-disable-next-line
  // @ts-ignore
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

  await import(
    '../../../src/lib/consumer/message-handler/consume-message-worker-thread'
  );

  await delay(5000);

  // In real world the thread would exit when the file has been imported
  // But process.exit is mocked so getHandlerFn() continues and trigger a second
  // exit call
  expect(mockExit).toHaveBeenCalledTimes(2);
  expect(mockExit).toHaveBeenNthCalledWith(1, 333);
  expect(mockExit).toHaveBeenNthCalledWith(
    2,
    EWorkerThreadMessageCodeExit.INVALID_HANDLER_TYPE,
  );
});
