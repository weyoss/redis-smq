import { IRouteController } from '../../../lib/routing';

import { controller as mainScheduledMessagesController } from './scheduled-messages/controller';
import { controller as mainTimeSeriesController } from './time-series/controller';

export const mainController: IRouteController = {
  path: '/main',
  actions: [mainTimeSeriesController, mainScheduledMessagesController],
};
