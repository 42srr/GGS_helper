# 42 API 연동 제거 및 자체 로그인 전환 계획서

## 1. 개요

### 1.1 목적
GGS_helper 시스템에서 42 OAuth 및 42 API 의존성을 제거하고, 자체 로그인 시스템으로 전환하여 회의실 예약 관리 기능에 집중

### 1.2 작업 범위
- **제거 대상**:
  - 42 OAuth 로그인 시스템
  - 42 API 연동 (사용자 통계, 프로젝트, 연합 정보 등)
  - Dashboard 페이지 (42 API 데이터 표시)
  - 동아리 관리 기능 전체

- **유지 대상**:
  - 회의실 관리 기능
  - 예약 시스템
  - 사용자 관리 (자체 인증으로 전환)
  - 관리자 기능 (백업, 통계, 설정)
  - 패널티 시스템 (노쇼, 지각)

### 1.3 기술 스택
- Backend: NestJS + TypeORM + PostgreSQL
- Frontend: React + TypeScript
- Authentication: JWT (자체 구현)

---

## 2. 데이터베이스 변경 계획

### 2.1 테이블 삭제

#### 2.1.1 완전 삭제 대상
```sql
-- 동아리 관련 테이블 삭제
DROP TABLE IF EXISTS club_members CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;

-- 42 API 정보 테이블 삭제
DROP TABLE IF EXISTS info CASCADE;
```

**영향도 분석**:
- `club_members`: 동아리 멤버 정보 (clubs, users와 관계)
- `clubs`: 동아리 정보 (users와 leader_id 관계)
- `info`: 42 API에서 가져온 사용자 통계 (users와 1:1 관계)

### 2.2 Users 테이블 수정

#### 2.2.1 삭제할 컬럼
```sql
ALTER TABLE users DROP COLUMN IF EXISTS user_intraid;        -- 42 Intra ID
ALTER TABLE users DROP COLUMN IF EXISTS user_profileimgurl;  -- 42 프로필 이미지
ALTER TABLE users DROP COLUMN IF EXISTS user_refreshtoken;   -- OAuth Refresh Token
ALTER TABLE users DROP COLUMN IF EXISTS user_grade;          -- 42 Grade (Cadet 등)
```

#### 2.2.2 추가할 컬럼
```sql
-- 자체 로그인용 필드 추가
ALTER TABLE users ADD COLUMN user_username VARCHAR(50) UNIQUE NOT NULL;  -- 로그인 ID
ALTER TABLE users ADD COLUMN user_email VARCHAR(255) UNIQUE NOT NULL;
ALTER TABLE users ADD COLUMN user_password VARCHAR(255) NOT NULL;  -- bcrypt 해시
ALTER TABLE users ADD COLUMN user_phone VARCHAR(20);               -- 선택사항
```

**로그인 방식**: `user_username` (사용자 고유 ID)와 비밀번호 사용

#### 2.2.3 수정 후 Users 테이블 구조
| Column                | Type      | Nullable | Default           | Description                |
| --------------------- | --------- | -------- | ----------------- | -------------------------- |
| user_id               | integer   | NO       | AUTO_INCREMENT    | 사용자 고유 ID             |
| user_username         | varchar   | NO       | -                 | 사용자명 (로그인 ID, Unique) |
| user_email            | varchar   | NO       | -                 | 이메일 (Unique)            |
| user_password         | varchar   | NO       | -                 | 비밀번호 해시              |
| user_name             | varchar   | NO       | -                 | 실명                       |
| user_phone            | varchar   | YES      | -                 | 전화번호                   |
| user_isavailable      | boolean   | NO       | true              | 계정 활성화 상태           |
| user_role             | enum      | NO       | 'student'         | 역할 (student/staff/admin) |
| user_createdat        | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                  |
| user_updatedat        | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                  |
| user_lastloginat      | timestamp | YES      | -                 | 마지막 로그인              |
| no_show_count         | integer   | NO       | 0                 | 노쇼 횟수                  |
| last_no_show_at       | timestamp | YES      | -                 | 마지막 노쇼 일시           |
| late_count            | integer   | NO       | 0                 | 지각 횟수                  |
| is_reservation_banned | boolean   | NO       | false             | 예약 정지 여부             |
| ban_until             | timestamp | YES      | -                 | 예약 정지 해제 일시        |

### 2.3 Activity Logs 정리

#### 2.3.1 ActivityType Enum 수정
```typescript
// 삭제할 로그 타입
- CLUB_APPROVED
- CLUB_REJECTED
- CLUB_CREATED
- CLUB_UPDATED
- CLUB_DELETED

// 유지할 로그 타입
- ROOM_CREATED, ROOM_UPDATED, ROOM_DELETED
- USER_REGISTERED
- RESERVATION_CREATED, RESERVATION_CANCELLED
- BACKUP_CREATED, BACKUP_RESTORED
- SETTINGS_UPDATED
- SYSTEM_MAINTENANCE
- EXCEL_UPLOAD
```

#### 2.3.2 기존 동아리 로그 정리
```sql
-- 동아리 관련 활동 로그 모두 삭제
DELETE FROM activity_logs WHERE type IN (
  'CLUB_APPROVED', 'CLUB_REJECTED', 'CLUB_CREATED',
  'CLUB_UPDATED', 'CLUB_DELETED'
);
```

**참고**: 마이그레이션 시 필수로 실행하여 동아리 관련 로그를 모두 정리합니다.

### 2.4 마이그레이션 스크립트 작성

**파일**: `backend/src/migrations/{timestamp}-remove-42-integration.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class Remove42Integration1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 동아리 테이블 삭제
    await queryRunner.query('DROP TABLE IF EXISTS club_members CASCADE');
    await queryRunner.query('DROP TABLE IF EXISTS clubs CASCADE');

    // 2. Info 테이블 삭제
    await queryRunner.query('DROP TABLE IF EXISTS info CASCADE');

    // 3. Users 테이블에 새 컬럼 추가
    await queryRunner.addColumn('users', new TableColumn({
      name: 'user_username',
      type: 'varchar',
      length: '50',
      isUnique: true,
      isNullable: false,
      default: "'temp_' || user_id::text"  // 임시 기본값
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'user_email',
      type: 'varchar',
      length: '255',
      isUnique: true,
      isNullable: false,
      default: "'user' || user_id::text || '@temp.local'"  // 임시 기본값
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'user_password',
      type: 'varchar',
      length: '255',
      isNullable: false,
      default: "''" // 임시로 빈 문자열
    }));

    await queryRunner.addColumn('users', new TableColumn({
      name: 'user_phone',
      type: 'varchar',
      length: '20',
      isNullable: true
    }));

    // 4. Users 테이블에서 불필요한 컬럼 삭제
    await queryRunner.dropColumn('users', 'user_intraid');
    await queryRunner.dropColumn('users', 'user_profileimgurl');
    await queryRunner.dropColumn('users', 'user_refreshtoken');
    await queryRunner.dropColumn('users', 'user_grade');

    // 5. 동아리 관련 활동 로그 모두 삭제 (필수)
    await queryRunner.query(`
      DELETE FROM activity_logs WHERE type IN (
        'CLUB_APPROVED', 'CLUB_REJECTED', 'CLUB_CREATED',
        'CLUB_UPDATED', 'CLUB_DELETED'
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 로직 (필요시)
    // 주의: 삭제된 테이블과 데이터는 복구 불가
  }
}
```

---

## 3. 백엔드 변경 계획

### 3.1 모듈 삭제

#### 3.1.1 완전 삭제 대상
```bash
# 42 API 관련 모듈
backend/src/api-42/
├── api-42.module.ts
├── api-42.service.ts
├── api-42-scheduler.service.ts
├── api-42-admin.controller.ts
└── api-42-config.service.ts

# 동아리 관련 모듈
backend/src/club/
├── club.module.ts
├── club.service.ts
├── club.controller.ts
├── entities/
│   ├── club.entity.ts
│   └── club-member.entity.ts
└── dto/
    ├── create-club.dto.ts
    ├── update-club.dto.ts
    ├── join-club.dto.ts
    ├── update-member-status.dto.ts
    └── update-member-role.dto.ts

# 설정 파일
backend/config/api42-keys.json
```

**작업**:
```bash
# 디렉토리 삭제
rm -rf backend/src/api-42
rm -rf backend/src/club
rm -f backend/config/api42-keys.json
```

### 3.2 Auth 모듈 수정

#### 3.2.1 삭제할 파일
```bash
backend/src/auth/strategies/ft.strategy.ts
backend/src/auth/guards/ft-auth.guard.ts
```

#### 3.2.2 수정할 파일

**`backend/src/auth/auth.controller.ts`**:
- **삭제**:
  - `GET /auth/42` (42 OAuth 시작)
  - `GET /auth/42/callback` (42 OAuth 콜백)
- **추가**:
  - `POST /auth/register` (회원가입)
  - `POST /auth/login` (로그인 - username + password 사용)

**`backend/src/auth/auth.service.ts`**:
- **삭제**:
  - `validateOAuthLogin()` 메서드
- **추가**:
  - `register()`: 회원가입 처리
  - `validateUser()`: username/비밀번호 검증
  - `hashPassword()`: bcrypt 해싱
  - `comparePassword()`: 비밀번호 비교

**참고**: 이메일 인증 기능은 구현하지 않음 (불필요)

**예시 코드**:
```typescript
// auth.service.ts
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  async register(registerDto: RegisterDto) {
    const { email, password, username, name } = registerDto;

    // 중복 체크
    const existingUser = await this.userService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.userService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user = await this.userService.create({
      email,
      username,
      name,
      password: hashedPassword,
    });

    return { message: 'Registration successful. You can now login.' };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // username으로 사용자 조회
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // JWT 생성
    const payload = { userId: user.userId, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // 마지막 로그인 시간 업데이트
    await this.userService.updateLastLogin(user.userId);

    return {
      access_token: accessToken,
      user: {
        userId: user.userId,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    };
  }
}
```

#### 3.2.3 DTO 추가

**`backend/src/auth/dto/register.dto.ts`**:
```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, hyphens and underscores',
  })
  username: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase and number',
  })
  password: string;
}
```

**`backend/src/auth/dto/login.dto.ts`**:
```typescript
import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;  // 로그인 ID

  @IsString()
  password: string;
}
```

### 3.3 User 모듈 수정

#### 3.3.1 Entity 수정

**`backend/src/user/entities/user.entity.ts`**:
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_username', unique: true, length: 50 })
  username: string;

  @Column({ name: 'user_email', unique: true, length: 255 })
  email: string;

  @Column({ name: 'user_password', length: 255, select: false })
  password: string;

  @Column({ name: 'user_name', length: 100 })
  name: string;

  @Column({ name: 'user_phone', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'user_isavailable', default: true })
  isAvailable: boolean;

  @Column({
    name: 'user_role',
    type: 'enum',
    enum: ['student', 'staff', 'admin'],
    default: 'student'
  })
  role: string;

  @CreateDateColumn({ name: 'user_createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'user_updatedat' })
  updatedAt: Date;

  @Column({ name: 'user_lastloginat', nullable: true })
  lastLoginAt?: Date;

  @Column({ name: 'no_show_count', default: 0 })
  noShowCount: number;

  @Column({ name: 'last_no_show_at', nullable: true })
  lastNoShowAt?: Date;

  @Column({ name: 'late_count', default: 0 })
  lateCount: number;

  @Column({ name: 'is_reservation_banned', default: false })
  isReservationBanned: boolean;

  @Column({ name: 'ban_until', nullable: true })
  banUntil?: Date;

  // Relations
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];

  // Info 관계 삭제 (42 API 정보)
  // @OneToOne(() => Info, (info) => info.user, { cascade: true })
  // info: Info;

  // Club 관계 삭제
  // @OneToMany(() => ClubMember, (member) => member.user)
  // clubMembers: ClubMember[];
}
```

#### 3.3.2 Info Entity 삭제

**삭제**: `backend/src/user/entities/info.entity.ts`

#### 3.3.3 Service 수정

**`backend/src/user/user.service.ts`**:
- **삭제**:
  - `findOrCreate()` (42 OAuth 전용)
  - `updateUserStatsFromApi()` (42 API 데이터 동기화)
  - `getUserStats()` (대시보드용 42 데이터)
  - `refreshUserStats()` (42 API 강제 갱신)
- **추가**:
  - `findByEmail(email: string)`
  - `findByUsername(username: string)`
  - `create(createUserDto: CreateUserDto)`
  - `updateLastLogin(userId: number)`

**예시 코드**:
```typescript
@Injectable()
export class UserService {
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      select: ['userId', 'email', 'username', 'name', 'password', 'role'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      select: ['userId', 'email', 'username', 'name', 'password', 'role']
    });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  // 기존 유지: findOne, findAll, update, updateRole, etc.
}
```

#### 3.3.4 Controller 수정

**`backend/src/user/user.controller.ts`**:
- **삭제**:
  - `GET /users/dashboard` (42 API 데이터)
  - `GET /users/stats` (42 API 통계)
  - `POST /users/stats/refresh` (42 API 갱신)
- **유지**:
  - `GET /users` (사용자 목록)
  - `GET /users/reservation-status` (예약 가능 여부)
  - `PATCH /users/:id` (사용자 정보 수정)
  - `PATCH /users/:id/role` (역할 변경)
  - `PATCH /users/:id/reservation-ban` (예약 정지)
  - `GET /users/export` (Excel 내보내기)

### 3.4 Admin 모듈 수정

#### 3.4.1 Controller 수정

**`backend/src/admin/admin.controller.ts`**:
- **삭제**:
  - `POST /admin/system/test-api-keys` (42 API 키 테스트)
  - `GET /admin/api-keys/42/info` (42 API 키 정보)
  - `POST /admin/api-keys/42/set-new` (42 API 새 키 추가)
  - `POST /admin/api-keys/42/promote` (42 API 키 승격)
  - `POST /admin/api-keys/42/remove-new` (42 API 새 키 제거)
- **유지**:
  - Backup 관련 엔드포인트
  - System stats 엔드포인트
  - Settings 관련 엔드포인트
  - Activity logs 엔드포인트

### 3.5 App Module 수정

**`backend/src/app.module.ts`**:
```typescript
// 삭제할 import
- import { Api42Module } from './api-42/api-42.module';
- import { ClubModule } from './club/club.module';

// modules 배열에서 제거
@Module({
  imports: [
    // ...
    // Api42Module,  // 삭제
    // ClubModule,   // 삭제
  ],
})
```

### 3.6 환경 변수 정리

**`.env` 파일에서 삭제**:
```bash
# 42 OAuth 관련
FORTYTWO_CLIENT_ID
FORTYTWO_CLIENT_SECRET
FORTYTWO_CLIENT_SECRET_NEW
FORTYTWO_CALLBACK_URL

# 42 API 관련
FORTYTWO_API_UID
FORTYTWO_API_SECRET
FORTYTWO_API_SECRET_NEW
```

**참고**: 이메일 인증 기능을 사용하지 않으므로 SMTP 관련 환경 변수는 추가하지 않습니다.

### 3.7 의존성 패키지 정리

**제거 가능한 패키지**:
```bash
# 42 OAuth 전용 (사용 여부 재확인 필요)
npm uninstall passport-42
# 또는 @nestjs/passport 내부에서 사용
```

**추가 필요한 패키지**:
```bash
npm install bcrypt
npm install @types/bcrypt --save-dev
```

---

## 4. 프론트엔드 변경 계획

### 4.1 페이지 삭제

#### 4.1.1 완전 삭제 대상
```bash
# Dashboard 페이지 (42 API 데이터 표시)
frontend/src/pages/DashboardPage.tsx

# 동아리 관련 페이지
frontend/src/pages/club/
├── ClubsPage.tsx
├── CreateClubPage.tsx
├── ClubDetailPage.tsx
└── manage/
    ├── ClubManagePage.tsx
    ├── ClubManageMembersPage.tsx
    └── ClubManageSettingsPage.tsx

# 관리자 동아리 페이지
frontend/src/pages/admin/AdminClubsPage.tsx

# 42 OAuth 콜백 페이지
frontend/src/pages/AuthCallbackPage.tsx
```

**작업**:
```bash
rm frontend/src/pages/DashboardPage.tsx
rm frontend/src/pages/AuthCallbackPage.tsx
rm -rf frontend/src/pages/club
rm frontend/src/pages/admin/AdminClubsPage.tsx
```

### 4.2 로그인 페이지 수정

**`frontend/src/pages/LoginPage.tsx`**:

**변경 전**:
- "42 계정으로 로그인" 버튼 → `/auth/42` 리다이렉트

**변경 후**:
- 사용자 ID(username)/비밀번호 입력 폼
- 회원가입 링크

**예시 코드**:
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username, password);
      navigate('/reservations');
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">로그인</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              사용자 ID
            </label>
            <input
              id="username"
              type="text"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              로그인
            </button>
          </div>
          <div className="text-center">
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              계정이 없으신가요? 회원가입
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4.3 회원가입 페이지 추가

**`frontend/src/pages/RegisterPage.tsx`** (신규):
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    name: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await axios.post('/api/auth/register', {
        email: formData.email,
        username: formData.username,
        name: formData.name,
        password: formData.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || '회원가입에 실패했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">회원가입</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">이메일</label>
            <input
              type="email"
              name="email"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">사용자명</label>
            <input
              type="text"
              name="username"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">이름</label>
            <input
              type="text"
              name="name"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">비밀번호</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">비밀번호 확인</label>
            <input
              type="password"
              name="confirmPassword"
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              회원가입
            </button>
          </div>
          <div className="text-center">
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              이미 계정이 있으신가요? 로그인
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 4.4 AuthContext 수정

**`frontend/src/contexts/AuthContext.tsx`**:

**변경사항**:
- `login()` 메서드: 42 OAuth 리다이렉트 → API 호출로 변경
- URL 파라미터에서 토큰 읽기 로직 제거
- 사용자 정보 구조 변경 (intraId → username)

**수정 코드**:
```typescript
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 초기화: localStorage에서 토큰 확인
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshToken();
    } else {
      setLoading(false);
    }
  }, []);

  // 로그인 (username/비밀번호)
  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user_id', userData.userId.toString());

      setUser(userData);
      setAuthToken(access_token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      setUser(null);
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // 토큰 갱신 (앱 시작시)
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      setAuthToken(token);
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
    } finally {
      setLoading(false);
    }
  };

  // 권한 체크
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    // 역할 기반 권한 체크 로직
    const rolePermissions = {
      admin: ['user:read', 'user:update', 'user:role:update', 'room:create', 'room:update', 'room:delete', 'admin:*'],
      staff: ['user:read', 'room:create', 'room:update'],
      student: ['room:read', 'reservation:create'],
    };
    return rolePermissions[user.role]?.includes(permission) || false;
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    refreshToken,
    hasPermission,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### 4.5 App.tsx 라우팅 수정

**`frontend/src/App.tsx`**:

**삭제할 라우트**:
```typescript
- <Route path="/dashboard" element={<DashboardPage />} />
- <Route path="/auth/callback" element={<AuthCallbackPage />} />
- <Route path="/clubs" element={<ClubsPage />} />
- <Route path="/clubs/create" element={<CreateClubPage />} />
- <Route path="/clubs/:id" element={<ClubDetailPage />} />
- <Route path="/clubs/:id/manage" element={<ClubManagePage />} />
- <Route path="/clubs/:id/manage/members" element={<ClubManageMembersPage />} />
- <Route path="/clubs/:id/manage/settings" element={<ClubManageSettingsPage />} />
- <Route path="/admin/clubs" element={<AdminClubsPage />} />
```

**추가할 라우트**:
```typescript
+ <Route path="/register" element={<RegisterPage />} />
```

**참고**: 이메일 인증 기능을 사용하지 않으므로 비밀번호 찾기/재설정, 이메일 인증 관련 라우트는 추가하지 않습니다.

**홈 페이지 리다이렉트 변경**:
```typescript
// 변경 전
<Route path="/" element={<Navigate to="/dashboard" />} />

// 변경 후
<Route path="/" element={<Navigate to="/reservations" />} />
```

### 4.6 Header 컴포넌트 수정

**`frontend/src/components/layout/Header.tsx`**:

**삭제**:
- 동아리 관련 드롭다운 메뉴 (lines 76-102)
- Dashboard 링크

**수정**:
- 사용자 프로필 이미지 표시 로직 (42 API 프로필 이미지 → 기본 아바타)
- 사용자 이름 표시: `user.name` → `user.username` 또는 `user.name`

**예시**:
```typescript
// 프로필 이미지 표시 (기본 아바타)
<div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
  {user.username.charAt(0).toUpperCase()}
</div>

// 사용자명 표시
<span>{user.username}</span>  {/* 또는 user.name */}
```

### 4.7 관리자 페이지 수정

**`frontend/src/pages/AdminPage.tsx`**:

**삭제**:
- 동아리 관리 카드

**유지**:
- 사용자 관리
- 회의실 관리
- 예약 관리
- 통계
- 백업
- 설정

---

## 5. 작업 순서 및 단계

### 5.1 작업 전 준비 (Phase 0)

#### 체크리스트:
- [ ] 현재 데이터베이스 백업 생성 (필수!)
  ```bash
  POST /api/admin/backup/create
  # 또는 직접 PostgreSQL 덤프
  docker exec -it postgres_container pg_dump -U postgres ggs_helper > backup_$(date +%Y%m%d).sql
  ```
- [ ] Git 브랜치 생성
  ```bash
  git checkout -b remove-42-integration
  ```
- [ ] 문서 검토 및 팀원 공유
- [ ] 테스트 환경 준비 (별도 데이터베이스)

---

### 5.2 Phase 1: 백엔드 구조 변경 (인증 시스템)

**예상 소요 시간**: 2-3일

#### 작업 순서:
1. **Auth 모듈 수정** (1일):
   - [ ] `RegisterDto`, `LoginDto` DTO 생성
   - [ ] `AuthService`에 `register()`, `login()`, `hashPassword()` 메서드 추가
   - [ ] `AuthController`에 `/auth/register`, `/auth/login` 엔드포인트 추가
   - [ ] `bcrypt` 패키지 설치 및 설정
   - [ ] 기존 42 OAuth 관련 코드 주석 처리 (아직 삭제하지 않음)

2. **User Entity 및 Service 수정** (1일):
   - [ ] `User` Entity에 새 컬럼 추가 (`email`, `username`, `password`, etc.)
   - [ ] `UserService`에 `findByEmail()`, `findByUsername()` 메서드 추가
   - [ ] `CreateUserDto` 수정

3. **테스트** (0.5일):
   - [ ] 회원가입 API 테스트 (Postman/Insomnia)
   - [ ] 로그인 API 테스트
   - [ ] JWT 토큰 발급 및 검증 테스트

**마일스톤**: 자체 로그인 시스템이 동작하는 상태

---

### 5.3 Phase 2: 프론트엔드 로그인 UI 변경

**예상 소요 시간**: 2일

#### 작업 순서:
1. **로그인 페이지 수정** (0.5일):
   - [ ] `LoginPage.tsx` 폼 방식으로 변경
   - [ ] 이메일/비밀번호 입력 필드 추가
   - [ ] 42 OAuth 버튼 제거

2. **회원가입 페이지 생성** (0.5일):
   - [ ] `RegisterPage.tsx` 생성
   - [ ] 폼 유효성 검사 추가
   - [ ] 회원가입 API 연동

3. **AuthContext 수정** (0.5일):
   - [ ] `login()` 메서드를 API 호출로 변경
   - [ ] URL 파라미터 토큰 읽기 로직 제거
   - [ ] 사용자 정보 구조 변경

4. **라우팅 추가** (0.5일):
   - [ ] `/register` 라우트 추가
   - [ ] 홈 리다이렉트 변경 (`/dashboard` → `/reservations`)

**마일스톤**: 프론트엔드에서 회원가입 및 로그인 가능

---

### 5.4 Phase 3: 데이터베이스 마이그레이션

**예상 소요 시간**: 1일

#### 작업 순서:
1. **마이그레이션 스크립트 작성** (0.5일):
   - [ ] `remove-42-integration.migration.ts` 파일 생성
   - [ ] 테이블 추가/삭제/수정 로직 작성
   - [ ] 롤백 로직 작성 (선택사항)

2. **마이그레이션 실행** (0.5일):
   - [ ] 테스트 환경에서 먼저 실행
   - [ ] 데이터 무결성 검증
   - [ ] 운영 환경 실행 (신중히!)
     ```bash
     npm run typeorm:migration:run
     ```

**주의사항**:
- 기존 사용자 데이터가 있을 경우, `user_email`과 `user_username`의 기본값을 임시로 설정해야 함
- 마이그레이션 후 기존 사용자는 비밀번호 재설정 필요

**마일스톤**: 데이터베이스 구조가 새 인증 시스템에 맞게 변경됨

---

### 5.5 Phase 4: 42 API 및 동아리 기능 제거

**예상 소요 시간**: 2일

#### 작업 순서:
1. **백엔드 모듈 삭제** (1일):
   - [ ] `api-42/` 디렉토리 삭제
   - [ ] `club/` 디렉토리 삭제
   - [ ] `app.module.ts`에서 모듈 import 제거
   - [ ] `Info` Entity 삭제
   - [ ] `User` Entity에서 관계 제거
   - [ ] `UserService`에서 42 API 관련 메서드 삭제
   - [ ] `AdminController`에서 42 API 관련 엔드포인트 삭제

2. **프론트엔드 페이지 삭제** (0.5일):
   - [ ] `DashboardPage.tsx` 삭제
   - [ ] `AuthCallbackPage.tsx` 삭제
   - [ ] `club/` 디렉토리 삭제
   - [ ] `admin/AdminClubsPage.tsx` 삭제
   - [ ] `App.tsx`에서 라우트 제거

3. **Header 컴포넌트 정리** (0.5일):
   - [ ] 동아리 메뉴 제거
   - [ ] Dashboard 링크 제거
   - [ ] 프로필 이미지 표시 로직 수정

**마일스톤**: 42 API 및 동아리 기능이 완전히 제거됨

---

### 5.6 Phase 5: 환경 변수 및 설정 정리

**예상 소요 시간**: 0.5일

#### 작업 순서:
- [ ] `.env` 파일에서 42 관련 변수 제거
- [ ] `.env.example` 업데이트
- [ ] `package.json`에서 불필요한 의존성 제거
- [ ] `backend/config/api42-keys.json` 삭제 (존재 시)

---

### 5.7 Phase 6: 문서 업데이트

**예상 소요 시간**: 1일

#### 작업 순서:
1. **API 문서 수정** (0.5일):
   - [ ] [API.md](../API.md) 업데이트
     - 42 OAuth 관련 섹션 삭제
     - 동아리 API 섹션 삭제
     - 자체 인증 API 추가
   - [ ] 엔드포인트 목록 정리

2. **데이터베이스 문서 수정** (0.5일):
   - [ ] [tables.md](../tables.md) 업데이트
     - `clubs`, `club_members`, `info` 테이블 삭제
     - `users` 테이블 구조 변경 반영
     - ER 다이어그램 업데이트

3. **README 업데이트**:
   - [ ] 실행 방법 수정 (환경 변수)
   - [ ] 기능 설명 업데이트

4. **유지보수 문서 수정**:
   - [ ] [AS.md](../AS.md) 업데이트
     - 42 API 키 관리 섹션 삭제
     - 자체 인증 관련 유지보수 내용 추가

---

### 5.8 Phase 7: 통합 테스트 및 QA

**예상 소요 시간**: 1-2일

#### 테스트 체크리스트:

**인증 테스트**:
- [ ] 회원가입 프로세스
  - [ ] 유효성 검사 (이메일 형식, 비밀번호 강도)
  - [ ] 중복 이메일/사용자명 체크
  - [ ] 성공 시 데이터베이스 저장 확인
- [ ] 로그인 프로세스
  - [ ] 올바른 이메일/비밀번호로 로그인
  - [ ] 잘못된 자격증명 처리
  - [ ] JWT 토큰 발급 및 저장 확인
- [ ] 로그아웃
  - [ ] 토큰 무효화
  - [ ] localStorage 정리

**회의실 예약 테스트**:
- [ ] 예약 생성
- [ ] 예약 조회 (본인, 전체)
- [ ] 예약 수정/취소
- [ ] 체크인 기능
- [ ] 노쇼 신고

**패널티 시스템 테스트**:
- [ ] 지각 3회 → 노쇼 1회 전환
- [ ] 노쇼 발생 시 7일 예약 정지
- [ ] 예약 정지 상태에서 예약 시도 차단

**관리자 기능 테스트**:
- [ ] 사용자 관리 (역할 변경, 정지)
- [ ] 회의실 관리 (생성, 수정, 삭제)
- [ ] 예약 관리 (강제 취소, 상태 변경)
- [ ] 백업/복원
- [ ] 통계 조회

**UI/UX 테스트**:
- [ ] 모든 페이지 네비게이션 확인
- [ ] 권한 기반 UI 표시 (학생/스태프/관리자)
- [ ] 에러 메시지 표시
- [ ] 반응형 디자인 확인

**성능 테스트**:
- [ ] API 응답 시간 측정
- [ ] 동시 사용자 테스트 (선택사항)

---

### 5.9 Phase 8: 배포 및 모니터링

**예상 소요 시간**: 0.5일

#### 작업 순서:
1. **배포 전 체크**:
   - [ ] Git 커밋 및 푸시
   - [ ] 운영 데이터베이스 백업 생성
   - [ ] 배포 공지 (사용자 대상)

2. **배포**:
   - [ ] 백엔드 배포
   - [ ] 프론트엔드 배포
   - [ ] 마이그레이션 실행

3. **배포 후 모니터링**:
   - [ ] 로그인 성공률 모니터링
   - [ ] 에러 로그 확인
   - [ ] 사용자 피드백 수집

4. **긴급 롤백 준비**:
   - [ ] 이전 버전 복구 스크립트 준비
   - [ ] 데이터베이스 백업 복원 테스트

---

### 5.10 전체 일정 요약

| Phase | 작업 내용                    | 예상 소요 시간 | 담당자 (예시) |
| ----- | ---------------------------- | -------------- | ------------- |
| 0     | 작업 전 준비                 | 0.5일          | 전체 팀       |
| 1     | 백엔드 인증 시스템 구현      | 2-3일          | Backend 팀    |
| 2     | 프론트엔드 로그인 UI 변경    | 2일            | Frontend 팀   |
| 3     | 데이터베이스 마이그레이션    | 1일            | Backend 팀    |
| 4     | 42 API 및 동아리 기능 제거   | 2일            | 전체 팀       |
| 5     | 환경 변수 및 설정 정리       | 0.5일          | Backend 팀    |
| 6     | 문서 업데이트                | 1일            | 전체 팀       |
| 7     | 통합 테스트 및 QA            | 1-2일          | 전체 팀       |
| 8     | 배포 및 모니터링             | 0.5일          | DevOps 팀     |

**총 예상 소요 시간**: 10-13일 (약 2주)

---

## 6. 리스크 관리

### 6.1 주요 리스크 및 대응 방안

| 리스크                            | 영향도 | 발생 가능성 | 대응 방안                                                                 |
| --------------------------------- | ------ | ----------- | ------------------------------------------------------------------------- |
| 기존 사용자 데이터 손실           | 높음   | 중간        | 마이그레이션 전 필수 백업, 테스트 환경 검증                               |
| 마이그레이션 실패                 | 높음   | 낮음        | 롤백 스크립트 준비, 단계별 검증                                           |
| 기존 사용자가 로그인 불가         | 높음   | 높음        | 비밀번호 재설정 프로세스 구현, 사용자 공지                                |
| 인증 로직 버그                    | 중간   | 중간        | 철저한 테스트, 보안 검토                                                  |
| 프론트엔드-백엔드 API 불일치      | 중간   | 낮음        | API 문서 업데이트, TypeScript 타입 정의                                   |
| 패널티 시스템 데이터 손실         | 낮음   | 낮음        | 예약 관련 테이블은 변경 없음                                              |
| 배포 후 긴급 버그 발견            | 높음   | 중간        | 롤백 계획 수립, 24시간 모니터링                                           |
| 사용자 이탈                       | 중간   | 낮음        | 사전 공지, 온보딩 가이드 제공                                             |
| 비밀번호 보안 취약점              | 높음   | 낮음        | bcrypt 사용 (최소 10 rounds), 비밀번호 정책 강화                          |

---

### 6.2 기존 사용자 데이터 마이그레이션 전략

**문제**: 기존 42 OAuth 사용자는 username/이메일/비밀번호가 없음

**해결 방안**:

#### Option 1: 초기 비밀번호 설정 강제 (권장)
1. 마이그레이션 시 임시 username/이메일 생성
   ```sql
   UPDATE users SET
     user_username = user_intraid,  -- 기존 42 Intra ID를 username으로
     user_email = user_intraid || '@temp.local',  -- 임시 이메일
     user_password = ''  -- 빈 문자열 (로그인 불가 상태)
   ```
2. 첫 로그인 시도 시 "초기 설정" 페이지로 리다이렉트
3. 이메일 주소 및 비밀번호 설정 후 사용 가능
4. Username은 기존 user_intraid로 고정 (변경 불가)

#### Option 2: 완전 초기화
- 모든 사용자 데이터 삭제 후 재가입 요청
- 예약 이력은 유지 가능 (user_id 기준)
- 관리자가 직접 사용자 생성

**권장**: Option 1 (초기 비밀번호 설정 강제)

---

### 6.3 롤백 계획

**조건**: 배포 후 30분 이내 치명적 버그 발견 시

**절차**:
1. **즉시 이전 버전으로 복구**:
   ```bash
   git revert HEAD
   npm run build
   # 또는 이전 Docker 이미지로 롤백
   ```

2. **데이터베이스 복원**:
   ```bash
   docker exec -i postgres_container psql -U postgres ggs_helper < backup_YYYYMMDD.sql
   ```

3. **환경 변수 복원**:
   - `.env` 파일에서 42 OAuth 관련 변수 복원

4. **사용자 공지**:
   - "시스템 점검 중" 공지
   - 예상 복구 시간 안내

**목표**: 30분 이내 서비스 정상화

---

## 7. 추가 고려 사항

### 7.1 선택적 기능

#### 7.1.1 OAuth 대안 (구글, 네이버 로그인)
**필요성**: 낮음 (회의실 예약 시스템에는 과도)

**작업 시간**: +2-3일 (OAuth별로 1일)

#### 7.1.2 2단계 인증 (2FA)
**필요성**: 낮음 (관리자 계정에만 고려)

**작업 시간**: +2일

---

### 7.2 보안 강화

#### 7.2.1 비밀번호 정책
- 최소 8자 이상
- 대문자, 소문자, 숫자 포함 필수
- 특수문자 권장
- 흔한 비밀번호 차단 (선택사항)

#### 7.2.2 Rate Limiting
- 로그인 시도 횟수 제한 (5회/10분)
- 회원가입 제한 (IP당 3회/시간)
- `@nestjs/throttler` 패키지 사용

#### 7.2.3 HTTPS 적용
- 운영 환경에서 필수
- Let's Encrypt 인증서 사용

---

### 7.3 사용자 온보딩 가이드

**배포 시 사용자 공지 내용**:

```
[중요] GGS Helper 로그인 방식 변경 안내

안녕하세요, GGS Helper 운영팀입니다.

YYYY년 MM월 DD일부터 로그인 방식이 변경됩니다.

변경 사항:
- 기존: 42 계정으로 로그인
- 변경: 사용자 ID/비밀번호 로그인

기존 사용자 조치 사항:
1. 첫 방문 시 "초기 설정" 페이지가 표시됩니다.
2. 사용자 ID는 기존 42 Intra ID로 자동 설정됩니다.
3. 이메일 주소와 새 비밀번호를 설정해주세요.
4. 이후 해당 사용자 ID/비밀번호로 로그인 가능합니다.

신규 사용자:
- "회원가입" 버튼을 클릭하여 계정을 생성하세요.

문의사항: ggs@42gyeongsan.kr

감사합니다.
```

---

## 8. 체크리스트 요약

### 8.1 백엔드 체크리스트

**Auth 모듈**:
- [ ] `RegisterDto`, `LoginDto` DTO 생성 (username 기반)
- [ ] `AuthService.register()` 구현
- [ ] `AuthService.login()` 구현 (username + password)
- [ ] `AuthService.hashPassword()` 구현
- [ ] `AuthController` 엔드포인트 추가
- [ ] bcrypt 패키지 설치

**User 모듈**:
- [ ] `User` Entity 수정 (새 컬럼 추가, 기존 컬럼 삭제)
- [ ] `Info` Entity 삭제
- [ ] `UserService.findByEmail()` 추가
- [ ] `UserService.findByUsername()` 추가
- [ ] `UserService.create()` 수정
- [ ] 42 API 관련 메서드 삭제

**삭제**:
- [ ] `api-42/` 디렉토리 삭제
- [ ] `club/` 디렉토리 삭제
- [ ] `ft.strategy.ts`, `ft-auth.guard.ts` 삭제
- [ ] `app.module.ts`에서 모듈 제거

**마이그레이션**:
- [ ] 마이그레이션 스크립트 작성
- [ ] 테스트 환경에서 실행
- [ ] 운영 환경에서 실행

---

### 8.2 프론트엔드 체크리스트

**페이지 수정/생성**:
- [ ] `LoginPage.tsx` 폼 방식으로 변경
- [ ] `RegisterPage.tsx` 생성
- [ ] `ForgotPasswordPage.tsx` 생성 (선택)
- [ ] `ResetPasswordPage.tsx` 생성 (선택)
- [ ] `VerifyEmailPage.tsx` 생성 (선택)

**삭제**:
- [ ] `DashboardPage.tsx` 삭제
- [ ] `AuthCallbackPage.tsx` 삭제
- [ ] `club/` 디렉토리 삭제
- [ ] `admin/AdminClubsPage.tsx` 삭제

**컴포넌트 수정**:
- [ ] `AuthContext.tsx` 수정
- [ ] `Header.tsx` 동아리 메뉴 제거
- [ ] `App.tsx` 라우팅 수정

---

### 8.3 문서화 체크리스트

- [ ] [API.md](../API.md) 업데이트
- [ ] [tables.md](../tables.md) 업데이트
- [ ] [AS.md](../AS.md) 업데이트
- [ ] README.md 업데이트
- [ ] `.env.example` 업데이트

---

### 8.4 테스트 체크리스트

**기능 테스트**:
- [ ] 회원가입
- [ ] 로그인/로그아웃
- [ ] 예약 생성/조회/수정/취소
- [ ] 노쇼/지각 처리
- [ ] 관리자 기능

**보안 테스트**:
- [ ] SQL Injection 방지
- [ ] XSS 방지
- [ ] 비밀번호 해싱 확인
- [ ] JWT 검증

**성능 테스트**:
- [ ] API 응답 시간
- [ ] 데이터베이스 쿼리 최적화

---

## 9. 결론

### 9.1 기대 효과

**긍정적 효과**:
- ✅ 42 API 의존성 제거로 서비스 안정성 향상
- ✅ 유지보수 복잡도 감소 (42 API 키 관리 불필요)
- ✅ 회의실 예약 기능에 집중
- ✅ 자체 인증으로 더 많은 제어권 확보
- ✅ 불필요한 기능(동아리) 제거로 코드베이스 간소화

**주의 사항**:
- ⚠️ 기존 사용자는 비밀번호 재설정 필요
- ⚠️ 마이그레이션 과정에서 데이터 손실 위험
- ⚠️ 초기 배포 후 모니터링 필수

---

### 9.2 다음 단계

1. **팀 리뷰**: 본 계획서를 팀원과 공유하고 피드백 수렴
2. **일정 조율**: 작업 시작 시점 결정 (예: 방학 기간)
3. **백업 생성**: 현재 시스템 완전 백업
4. **작업 시작**: Phase 1부터 순차적 진행
5. **정기 체크인**: 매일 진행 상황 공유
6. **배포**: 철저한 테스트 후 배포
7. **모니터링**: 배포 후 1주일간 집중 모니터링

---

**문서 작성일**: 2026-01-08
**작성자**: Claude (GGS Helper AI Assistant)
**버전**: 1.0.0
**검토자**: (팀원 이름 추가 예정)
**승인자**: (프로젝트 리더 이름 추가 예정)

---

## 부록

### A. 참고 자료

- [NestJS Authentication](https://docs.nestjs.com/security/authentication)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [bcrypt 사용법](https://www.npmjs.com/package/bcrypt)
- [JWT 베스트 프랙티스](https://tools.ietf.org/html/rfc8725)

### B. 문의처

- **기술 문의**: GGS 백엔드 팀 (yutsong)
- **일정 조율**: GGS 운영진
- **긴급 상황**: ggs@42gyeongsan.kr (예시)
