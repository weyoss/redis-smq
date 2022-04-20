import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { DeleteQueueRequestDTO } from './delete-queue.request.DTO';
import { DeleteQueueResponseDTO } from './delete-queue.response.DTO';
import { queuesServiceInstance } from '../../../../../services';

export const DeleteQueueHandler: TRouteControllerActionHandler<
  DeleteQueueRequestDTO,
  DeleteQueueResponseDTO
> = () => {
  return async (ctx) => {
    return queuesServiceInstance().deleteQueue(ctx.state.dto);
  };
};
