/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EControllerRequestMethod,
  EControllerRequestPayload,
} from '../../../lib/controller/types/index.js';
import { TRouterResourceMap } from '../../../lib/router/types/index.js';
import { deleteMessageByIdController } from '../../../controllers/message/deleteMessageByIdController.js';
import { deleteMessagesByIdsController } from '../../../controllers/message/deleteMessagesByIdsController.js';
import { getMessageByIdController } from '../../../controllers/message/getMessageByIdController.js';
import { getMessagesByIdsController } from '../../../controllers/message/getMessagesByIdsController.js';
import { getMessageStatusController } from '../../../controllers/message/getMessageStatusController.js';
import { publishMessageController } from '../../../controllers/message/publishMessageController.js';
import { requeueMessageByIdController } from '../../../controllers/message/requeueMessageByIdController.js';

export const messages: TRouterResourceMap = {
  path: 'messages',
  tags: ['Messages'],
  resource: [
    {
      handler: publishMessageController,
      method: EControllerRequestMethod.POST,
      payload: [EControllerRequestPayload.BODY],
    },
    {
      handler: getMessagesByIdsController,
      method: EControllerRequestMethod.GET,
      payload: [EControllerRequestPayload.QUERY],
    },
    {
      handler: deleteMessagesByIdsController,
      method: EControllerRequestMethod.DELETE,
      payload: [EControllerRequestPayload.QUERY],
    },
    {
      path: ':id',
      resource: [
        {
          handler: getMessageByIdController,
          method: EControllerRequestMethod.GET,
          payload: [EControllerRequestPayload.PATH],
        },
        {
          handler: requeueMessageByIdController,
          method: EControllerRequestMethod.POST,
          payload: [EControllerRequestPayload.PATH],
        },
        {
          handler: deleteMessageByIdController,
          method: EControllerRequestMethod.DELETE,
          payload: [EControllerRequestPayload.PATH],
        },
        {
          path: 'requeue',
          resource: [
            {
              handler: requeueMessageByIdController,
              method: EControllerRequestMethod.POST,
              payload: [EControllerRequestPayload.PATH],
            },
          ],
        },
        {
          path: 'status',
          resource: [
            {
              handler: getMessageStatusController,
              method: EControllerRequestMethod.GET,
              payload: [EControllerRequestPayload.PATH],
            },
          ],
        },
      ],
    },
  ],
};
