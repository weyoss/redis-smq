import { TApplication } from '../../../../../../types/common';
import { TQueueTimeSeriesRequestContext } from '../context';

export function GetQueuePublishedHandler(app: TApplication) {
  return async (ctx: TQueueTimeSeriesRequestContext) => {
    const { queueTimeSeriesService } = app.context.services;
    return queueTimeSeriesService.published(ctx.state.dto);
  };
}
