import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateClubDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  leaderId: number;

  @IsString()
  @IsOptional()
  description?: string;
}
