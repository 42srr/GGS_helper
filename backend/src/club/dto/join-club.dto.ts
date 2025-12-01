import { IsNumber, IsNotEmpty } from 'class-validator';

export class JoinClubDto {
  @IsNumber()
  @IsNotEmpty()
  clubId: number;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
