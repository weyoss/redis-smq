import { IRouteController } from '../../lib/routing';
import { mainController } from './main/main.controller';
import { queuesController } from './queues/queues.controller';
import { namespacesController } from './namespaces/namespaces.controller';
import { consumersController } from './consumers/consumers.controller';

export const apiController: IRouteController = {
  path: '/api',
  actions: [
    mainController,
    namespacesController,
    queuesController,
    consumersController,
  ],
};
