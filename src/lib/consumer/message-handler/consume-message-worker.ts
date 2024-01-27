/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import path from 'path';
import { Worker } from 'worker_threads';
import { ICallback } from 'redis-smq-common';
import { IMessageParams } from '../../../../types';
import {
  EWorkerThreadMessageCodeExit,
  EWorkerThreadMessageCodeConsume,
  TWorkerThreadMessage,
} from './consume-message-worker-thread';
import { ConsumerMessageHandlerWorkerError } from './errors';

export class ConsumeMessageWorker {
  protected messageHandlerFilename;
  protected messageHandlerThread: Worker | null = null;

  constructor(messageHandlerFilename: string) {
    this.messageHandlerFilename = messageHandlerFilename;
  }

  protected getMessageHandlerThread(): Worker {
    if (!this.messageHandlerThread) {
      this.messageHandlerThread = new Worker(
        path.resolve(__dirname, './consume-message-worker-thread.js'),
        {
          workerData: this.messageHandlerFilename,
        },
      );
      this.messageHandlerThread.on('messageerror', (err) => {
        console.error(err);
      });
      this.messageHandlerThread.on('error', (err) => {
        console.error(err);
      });
      this.messageHandlerThread.on('exit', () => {
        this.messageHandlerThread = null;
      });
    }
    return this.messageHandlerThread;
  }

  consume(message: IMessageParams, cb: ICallback<void>): void {
    const worker = this.getMessageHandlerThread();

    const cleanUp = () => {
      worker
        .removeListener('message', onMessage)
        .removeListener('exit', onExit);
    };

    const onMessage = (msg: TWorkerThreadMessage) => {
      cleanUp();
      if (msg.code !== EWorkerThreadMessageCodeConsume.OK) {
        console.error(`ConsumerMessageHandlerWorkerError`, msg);
        cb(new ConsumerMessageHandlerWorkerError(msg));
      } else cb();
    };

    const onExit = () => {
      cleanUp();
      const msg = {
        code: EWorkerThreadMessageCodeExit.TERMINATED,
        error: null,
      };
      console.error('ConsumerMessageHandlerWorkerError', msg);
      cb(new ConsumerMessageHandlerWorkerError(msg));
    };

    worker.once('message', onMessage);
    worker.once('exit', onExit);
    worker.postMessage(message);
  }

  quit(cb: ICallback<void>) {
    const callback = () => {
      this.messageHandlerThread = null;
      cb();
    };
    if (this.messageHandlerThread) {
      this.messageHandlerThread.terminate().then(callback).catch(callback);
    } else cb();
  }
}
