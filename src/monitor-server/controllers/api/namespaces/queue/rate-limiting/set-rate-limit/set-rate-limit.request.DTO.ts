import { IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QueueRequestDTO } from '../../../../../common/dto/queues/queue-request.DTO';

export class SetRateLimitRequestDTO extends QueueRequestDTO {
  @IsNumber()
  @Min(1000)
  @Type(() => Number)
  interval!: number;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit!: number;
}
