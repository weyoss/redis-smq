import { IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageDTO } from '../../common/message.DTO';

export class GetScheduledMessagesResponseBodyDataDTO {
  @IsInt()
  total!: number;

  @ValidateNested()
  @Type(() => MessageDTO)
  items!: MessageDTO[];
}

export class GetScheduledMessagesResponseBodyDTO {
  @ValidateNested()
  @Type(() => GetScheduledMessagesResponseBodyDataDTO)
  data!: GetScheduledMessagesResponseBodyDataDTO;
}

export class GetScheduledMessagesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetScheduledMessagesResponseBodyDTO)
  body!: GetScheduledMessagesResponseBodyDTO;
}
