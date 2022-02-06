import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { DeleteNamespaceRequestDTO } from './delete-namespace.request.DTO';
import { DeleteNamespaceResponseDTO } from './delete-namespace.response.DTO';

export const DeleteNamespaceHandler: TRouteControllerActionHandler<
  DeleteNamespaceRequestDTO,
  DeleteNamespaceResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queuesService } = app.context.services;
    return queuesService.deleteNamespace(ctx.state.dto);
  };
};
