/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParsedParams } from '../../../queue-manager/index.js';
import { async, ICallback, ILogger } from 'redis-smq-common';
import { IBrowserPage } from '../types/index.js';
import { redisKeys } from '../../../common/redis/redis-keys/redis-keys.js';
import { IBrowserStorage } from '../browser-storage/browser-storage-abstract.js';
import { _getPaginationParameters } from './_get-pagination-parameters.js';

export function _getMessageIds(
  parsedParams: IQueueParsedParams,
  page: number,
  pageSize: number,
  redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
  messageStorage: IBrowserStorage,
  logger: ILogger,
  cb: ICallback<IBrowserPage<string>>,
): void {
  logger.debug(
    `Getting message IDs for ${parsedParams.queueParams.name}, page ${page}, size ${pageSize}`,
  );

  const keys = redisKeys.getQueueKeys(
    parsedParams.queueParams.ns,
    parsedParams.queueParams.name,
    parsedParams.groupId,
  );
  const keyVal = keys[redisKey];

  async.waterfall(
    [
      (next: ICallback<number>) => {
        messageStorage.count(keyVal, next);
      },
      (totalItems: number, next: ICallback<IBrowserPage<string>>) => {
        if (totalItems === 0) {
          return next(null, { totalItems, items: [] });
        }

        const pageInfo = _getPaginationParameters(page, totalItems, pageSize);

        messageStorage.fetchItems(
          keyVal,
          {
            page: pageInfo.currentPage,
            pageSize: pageInfo.pageSize,
            offsetStart: pageInfo.offsetStart,
            offsetEnd: pageInfo.offsetEnd,
          },
          (err, items) => {
            if (err) return next(err);
            next(null, {
              totalItems,
              items: items ?? [],
            });
          },
        );
      },
    ],
    (err, result) => {
      if (err) {
        logger.error(`Error in _getMessageIds: ${err.message}`);
      }
      cb(err, result);
    },
  );
}
