import { IRouteController } from '../../lib/routing';
import { mainController } from './main/main.controller';
import { queuesController } from './queues/queues.controller';

export const apiController: IRouteController = {
  path: '/api',
  actions: [mainController, queuesController],
};
