import { IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageDTO } from './message.DTO';

export class GetMessagesResponseBodyDataItemsDTO {
  @IsInt()
  sequenceId!: number;

  @ValidateNested()
  @Type(() => MessageDTO)
  message!: MessageDTO;
}

export class GetMessagesResponseBodyDataDTO {
  @IsInt()
  total!: number;

  @ValidateNested()
  @Type(() => GetMessagesResponseBodyDataItemsDTO)
  items!: GetMessagesResponseBodyDataItemsDTO[];
}

export class GetMessagesResponseBodyDTO {
  @ValidateNested()
  @Type(() => GetMessagesResponseBodyDataDTO)
  data!: GetMessagesResponseBodyDataDTO;
}
