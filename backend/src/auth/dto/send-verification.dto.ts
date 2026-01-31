import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendVerificationDto {
  @ApiProperty({
    description: '인트라 ID (Slack 프로필 display name과 일치해야 함)',
    example: 'jsmith',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Intra ID can only contain letters, numbers, hyphens and underscores',
  })
  intraId: string;
}
