import { IRouteController } from '../../../lib/routing';

import { controller as mainScheduledMessagesController } from './scheduled-messages/controller';
import { controller as mainMultiQueueProducerTimeSeriesController } from './multi-queue-producers/time-series/controller';
import { controller as mainTimeSeriesController } from './time-series/controller';

export const mainController: IRouteController = {
  path: '/main',
  actions: [
    {
      path: '/multi-queue-producers',
      actions: [
        {
          path: '/:producerId',
          actions: [mainMultiQueueProducerTimeSeriesController],
        },
      ],
    },
    mainTimeSeriesController,
    mainScheduledMessagesController,
  ],
};
