import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyCodeDto {
  @ApiProperty({
    description: '인트라 ID',
    example: 'jsmith',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  intraId: string;

  @ApiProperty({
    description: 'Slack DM으로 받은 6자리 인증 코드',
    example: '123456',
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  code: string;
}
