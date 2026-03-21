import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: '인트라 ID',
    example: 'jsmith',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  intraId: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'SecurePass123',
  })
  @IsString()
  password: string;
}
