import * as Router from '@koa/router';

export const messages = new Router({ prefix: '/messages' });
messages.get('/', (ctx: { body: string }) => (ctx.body = 'it works'));
