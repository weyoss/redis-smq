import * as Router from '@koa/router';
import { messages } from './messages';
import { queues } from './queues';
import { scheduler } from './scheduler';

export const api = new Router({ prefix: '/api' });
[messages, queues, scheduler].forEach((i) =>
  api.use(i.routes(), i.allowedMethods()),
);
