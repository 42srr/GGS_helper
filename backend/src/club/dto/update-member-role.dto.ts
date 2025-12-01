import { IsEnum, IsNotEmpty } from 'class-validator';
import { ClubMemberRole } from '../entities/club-member.entity';

export class UpdateMemberRoleDto {
  @IsEnum(ClubMemberRole)
  @IsNotEmpty()
  role: ClubMemberRole;
}
