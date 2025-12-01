import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateClubDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  leaderId?: number;

  @IsString()
  @IsOptional()
  description?: string;
}
