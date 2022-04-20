import { TRouteControllerActionHandler } from '../../../../lib/routing';
import { DeleteNamespaceRequestDTO } from './delete-namespace.request.DTO';
import { DeleteNamespaceResponseDTO } from './delete-namespace.response.DTO';
import { queuesServiceInstance } from '../../../../services';

export const DeleteNamespaceHandler: TRouteControllerActionHandler<
  DeleteNamespaceRequestDTO,
  DeleteNamespaceResponseDTO
> = () => {
  return async (ctx) => {
    return queuesServiceInstance().deleteNamespace(ctx.state.dto);
  };
};
