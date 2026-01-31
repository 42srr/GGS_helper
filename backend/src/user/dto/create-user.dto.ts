import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  intraId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
