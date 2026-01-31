import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class VerifyCodeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  intraId: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
