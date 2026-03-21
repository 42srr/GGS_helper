import { IsNotEmpty, IsDateString, IsNumber } from 'class-validator';

export class CheckConflictDto {
  @IsNotEmpty()
  @IsNumber()
  roomId: number;

  @IsNotEmpty()
  @IsDateString()
  startDatetime: string;

  @IsNotEmpty()
  @IsDateString()
  endDatetime: string;
}
