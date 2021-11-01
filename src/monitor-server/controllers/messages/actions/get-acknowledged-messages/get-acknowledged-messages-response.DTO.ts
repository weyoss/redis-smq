import { IsInt, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { GetMessagesResponseBodyDTO } from '../../../common/get-messages-response-body.DTO';

export class GetAcknowledgedMessagesResponseDTO {
  @IsInt()
  status!: number;

  @ValidateNested()
  @Type(() => GetMessagesResponseBodyDTO)
  body!: GetMessagesResponseBodyDTO;
}
