import { IsArray, IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageQueueDTO } from '../../../common/message-queue.DTO';

export class GetQueuesResponseBodyDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageQueueDTO)
  data!: MessageQueueDTO[];
}

export class GetQueuesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetQueuesResponseBodyDTO)
  body!: GetQueuesResponseBodyDTO;
}
