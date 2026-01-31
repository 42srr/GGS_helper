import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: '인트라 ID (영문, 숫자, -, _ 만 허용)',
    example: 'jsmith',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Intra ID can only contain letters, numbers, hyphens and underscores',
  })
  intraId: string;

  @ApiProperty({
    description: '비밀번호 (8자 이상, 대소문자+숫자 포함)',
    example: 'SecurePass123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;

  @ApiProperty({
    description: 'Slack DM으로 받은 6자리 인증 코드',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(6)
  verificationCode: string;
}
