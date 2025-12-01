import { IsEnum, IsNotEmpty } from 'class-validator';
import { ClubMemberStatus } from '../entities/club-member.entity';

export class UpdateMemberStatusDto {
  @IsEnum(ClubMemberStatus)
  @IsNotEmpty()
  status: ClubMemberStatus;
}
