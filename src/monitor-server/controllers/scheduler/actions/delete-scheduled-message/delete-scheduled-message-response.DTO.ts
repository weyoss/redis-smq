import { Equals, IsInt } from 'class-validator';

export class DeleteScheduledMessageResponseDTO {
  @IsInt()
  @Equals(204)
  status!: number;

  @Equals(undefined)
  body: undefined;
}
