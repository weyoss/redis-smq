import * as Router from '@koa/router';

export const queues = new Router({ prefix: '/queues' });
queues.get('/', (ctx: { body: string }) => (ctx.body = 'it works'));
