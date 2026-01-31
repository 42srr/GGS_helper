import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SendVerificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Intra ID can only contain letters, numbers, hyphens and underscores',
  })
  intraId: string;
}
