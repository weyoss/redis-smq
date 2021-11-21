import { IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageDTO } from '../../../common/message.DTO';

export class GetPendingMessagesWithPriorityResponseBodyDataDTO {
  @IsInt()
  total!: number;

  @ValidateNested()
  @Type(() => MessageDTO)
  items!: MessageDTO[];
}

export class GetPendingMessagesWithPriorityResponseBodyDTO {
  @ValidateNested()
  @Type(() => GetPendingMessagesWithPriorityResponseBodyDataDTO)
  data!: GetPendingMessagesWithPriorityResponseBodyDataDTO;
}

export class GetPendingMessagesWithPriorityResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetPendingMessagesWithPriorityResponseBodyDTO)
  body!: GetPendingMessagesWithPriorityResponseBodyDTO;
}
