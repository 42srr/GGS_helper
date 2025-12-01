export enum Role {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin',
}

// 권한 레벨 (숫자가 높을수록 상위 권한)
export const ROLE_HIERARCHY = {
  [Role.STUDENT]: 1,
  [Role.STAFF]: 2,
  [Role.ADMIN]: 4,
};

// 각 역할별 권한 매핑
export const PERMISSIONS = {
  [Role.STUDENT]: [
    'reservation:create',
    'reservation:read:own',
    'reservation:update:own',
    'reservation:delete:own',
    'room:read',
    'user:read:own',
    'user:update:own',
    'statistics:read',
    'club:create',
    'club:read',
    'club:join',
  ],

  [Role.STAFF]: [
    // 교육생 권한 + 추가 권한
    ...[
      'reservation:create',
      'reservation:read:own',
      'reservation:update:own',
      'reservation:delete:own',
    ],
    'room:read',
    'user:read:own',
    'user:update:own',
    // 추가 권한
    'reservation:read:all',
    'room:update',
    'user:read:all',
    'statistics:read',
    'club:create',
    'club:read',
    'club:update',
    'club:join',
  ],

  [Role.ADMIN]: [
    // 모든 권한
    'reservation:*',
    'room:*',
    'user:*',
    'admin:*',
    'statistics:*',
    'system:*',
    'club:*',
  ],
};
