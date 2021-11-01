import { IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { RequeueMessageRequestDTO } from './requeue-message-request.DTO';

export class RequeueMessageWithPriorityRequestDTO extends RequeueMessageRequestDTO {
  @IsInt()
  @Type(() => Number)
  priority!: number;
}
