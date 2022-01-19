import { TRequestContext } from '../../../../../types/common';
import { QueueTimeSeriesRequestDTO } from '../../../../common/dto/queues/queue-time-series-request.DTO';
import { ConsumerTimeSeriesRequestDTO } from '../../../../common/dto/queues/consumer-time-series-request.DTO';
import { TimeSeriesRequestDTO } from '../../../../common/dto/time-series/time-series-request.DTO';

export type TTimeSeriesRequestContext = TRequestContext<TimeSeriesRequestDTO>;

export type TQueueTimeSeriesRequestContext =
  TRequestContext<QueueTimeSeriesRequestDTO>;

export type TConsumerTimeSeriesRequestContext =
  TRequestContext<ConsumerTimeSeriesRequestDTO>;
