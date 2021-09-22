import * as Router from '@koa/router';

export const scheduler = new Router({ prefix: '/scheduler' });
scheduler.get('/', (ctx: { body: string }) => (ctx.body = 'it works'));
