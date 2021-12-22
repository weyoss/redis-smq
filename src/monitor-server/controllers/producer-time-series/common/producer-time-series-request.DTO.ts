import { IsUUID } from 'class-validator';
import { QueueTimeSeriesRequestDTO } from '../../queue-time-series/common/queue-time-series-request.DTO';

export class ProducerTimeSeriesRequestDTO extends QueueTimeSeriesRequestDTO {
  @IsUUID('4')
  producerId!: string;
}
