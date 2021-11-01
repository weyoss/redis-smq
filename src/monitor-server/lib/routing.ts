import * as Router from '@koa/router';
import { ClassConstructor } from 'class-transformer';
import { RequestValidator } from '../middlewares/request-validator';
import { ResponseValidator } from '../middlewares/response-validator';
import { TApplication, TRequestContext } from '../types/common';

export enum ERouteControllerActionPayload {
  QUERY = 'query',
  BODY = 'body',
  PATH = 'path',
}

export enum ERouteControllerActionMethod {
  GET = 'get',
  POST = 'post',
  DELETE = 'delete',
}

export type TRouteControllerActionHandler = (
  app: TApplication,
) => (ctx: TRequestContext<any, any>) => Promise<Record<any, any> | void>;

export type TRouteControllerAction = {
  path: string;
  method: ERouteControllerActionMethod;
  payload: ERouteControllerActionPayload[];
  Handler: TRouteControllerActionHandler;
  RequestDTO: ClassConstructor<any>;
  ResponseDTO: ClassConstructor<any>;
};

export type TRouteController = {
  prefix: string;
  actions: TRouteControllerAction[];
};

export function getActionRouter(
  app: TApplication,
  action: TRouteControllerAction,
): Router {
  const router = new Router();
  router[action.method](
    action.path,
    RequestValidator(action.RequestDTO, action.payload),
    async (ctx: TRequestContext<any>, next) => {
      const data = await action.Handler(app)(ctx);
      if (data) {
        ctx.status = 200;
        ctx.body = { data };
      } else {
        ctx.status = 204;
        ctx.body = undefined;
      }
      await next();
    },
    ResponseValidator(action.ResponseDTO),
  );
  return router;
}

export function getControllerRouter(
  app: TApplication,
  controller: TRouteController,
): Router {
  const controllerRouter = new Router({ prefix: controller.prefix });
  controller.actions.forEach((action) => {
    const router = getActionRouter(app, action);
    controllerRouter.use(router.routes(), router.allowedMethods());
  });
  return controllerRouter;
}

export function getApplicationRouter(
  app: TApplication,
  controllers: TRouteController[],
  prefix = '/api',
): Router {
  const applicationRouter = new Router({ prefix });
  controllers.forEach((controller) => {
    const controllerRouter = getControllerRouter(app, controller);
    applicationRouter.use(
      controllerRouter.routes(),
      controllerRouter.allowedMethods(),
    );
  });
  return applicationRouter;
}
