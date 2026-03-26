/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { key } from '../builder.js';

const mainPath = ['main'];

export const main = {
  getMainKeys() {
    return {
      keyConfiguration: key(...mainPath, 'cfg'),
      keyQueues: key(...mainPath, 'q'),
      keyExchanges: key(...mainPath, 'exs'),
      keyNamespaces: key(...mainPath, 'ns'),
      keyPurgeJobs: key(...mainPath, 'pg-jobs'),
      keyPurgeJobsPending: key(...mainPath, 'pg-jobs', 'pend'),
      keyPurgeJobsProcessing: key(...mainPath, 'pg-jobs', 'proc'),
    };
  },

  getJobKeys(jobId: string) {
    return {
      keyJobWorker: key(...mainPath, 'jobs', jobId, 'wrk'),
    };
  },

  getWorkerKeys(workerId: string) {
    return {
      keyWorkerHeartbeat: key(...mainPath, 'wrk', workerId, 'hb'),
    };
  },

  getConsumerKeys(consumerId: string) {
    return {
      keyConsumerQueues: key(...mainPath, 'cons', consumerId, 'q'),
      keyConsumerHeartbeat: key(...mainPath, 'cons', consumerId, 'hb'),
    };
  },

  getMessageKeys(messageId: string) {
    return {
      keyMessage: key(...mainPath, 'msg', messageId),
    };
  },
};
