import { IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GetQueuesResponseBodyDTO } from '../../queues/get-queues/get-queues.response.DTO';

export class GetNamespaceQueuesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetQueuesResponseBodyDTO)
  body!: GetQueuesResponseBodyDTO;
}
