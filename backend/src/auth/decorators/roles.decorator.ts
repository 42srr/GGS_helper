import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';

// 특정 역할이 필요한 엔드포인트에 사용
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// 권한 문자열로 체크하는 데코레이터
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// 자신의 리소스에만 접근 가능한 엔드포인트에 사용
export const OWNER_ONLY_KEY = 'owner_only';
export const OwnerOnly = () => SetMetadata(OWNER_ONLY_KEY, true);

// 동아리 리더만 접근 가능한 엔드포인트에 사용
export const CLUB_LEADER_ONLY_KEY = 'club_leader_only';
export const ClubLeaderOnly = () => SetMetadata(CLUB_LEADER_ONLY_KEY, true);
