/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ERequestMethod,
  ERequestPayload,
} from '../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../lib/router/types/index.js';
import { deleteMessageByIdController } from '../../controllers/message/deleteMessageByIdController.js';
import { deleteMessagesByIdsController } from '../../controllers/message/deleteMessagesByIdsController.js';
import { getMessageByIdController } from '../../controllers/message/getMessageByIdController.js';
import { getMessagesByIdsController } from '../../controllers/message/getMessagesByIdsController.js';
import { getMessageStatusController } from '../../controllers/message/getMessageStatusController.js';
import { publishMessageController } from '../../controllers/message/publishMessageController.js';
import { requeueMessageByIdController } from '../../controllers/message/requeueMessageByIdController.js';

export const messages: TRouterResourceMap = {
  path: 'messages',
  tags: ['Messages'],
  resource: [
    {
      handler: publishMessageController,
      method: ERequestMethod.POST,
      payload: [ERequestPayload.BODY],
    },
    {
      handler: getMessagesByIdsController,
      method: ERequestMethod.GET,
      payload: [ERequestPayload.QUERY],
    },
    {
      handler: deleteMessagesByIdsController,
      method: ERequestMethod.DELETE,
      payload: [ERequestPayload.QUERY],
    },
    {
      path: ':id',
      resource: [
        {
          handler: getMessageByIdController,
          method: ERequestMethod.GET,
          payload: [ERequestPayload.PATH],
        },
        {
          handler: requeueMessageByIdController,
          method: ERequestMethod.POST,
          payload: [ERequestPayload.PATH],
        },
        {
          handler: deleteMessageByIdController,
          method: ERequestMethod.DELETE,
          payload: [ERequestPayload.PATH],
        },
        {
          path: 'requeue',
          resource: [
            {
              handler: requeueMessageByIdController,
              method: ERequestMethod.POST,
              payload: [ERequestPayload.PATH],
            },
          ],
        },
        {
          path: 'status',
          resource: [
            {
              handler: getMessageStatusController,
              method: ERequestMethod.GET,
              payload: [ERequestPayload.PATH],
            },
          ],
        },
      ],
    },
  ],
};
