import { IsString, MinLength, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  intraId: string;

  @IsString()
  password: string;
}
