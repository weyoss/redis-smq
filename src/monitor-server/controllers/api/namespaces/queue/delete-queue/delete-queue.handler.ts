import { TRouteControllerActionHandler } from '../../../../../lib/routing';
import { DeleteQueueRequestDTO } from './delete-queue.request.DTO';
import { DeleteQueueResponseDTO } from './delete-queue.response.DTO';

export const DeleteQueueHandler: TRouteControllerActionHandler<
  DeleteQueueRequestDTO,
  DeleteQueueResponseDTO
> = (app) => {
  return async (ctx) => {
    const { queuesService } = app.context.services;
    return queuesService.deleteQueue(ctx.state.dto);
  };
};
