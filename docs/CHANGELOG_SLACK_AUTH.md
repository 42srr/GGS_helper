# Slack 인증 시스템 변경사항

## 개요

42 OAuth 기반 인증에서 Slack Bot API 기반 인증으로 전환했습니다.

## 변경 날짜

2026-01-31

## 주요 변경사항

### 1. 인증 방식 변경

**이전 (42 OAuth):**
- 42 OAuth를 통한 인증
- username, email 기반 로그인
- 42 API에 의존

**현재 (Slack 인증):**
- Slack Bot API를 통한 인증
- intraId 기반 로그인
- Slack DM으로 인증 코드 전송
- 6자리 코드로 본인 확인

### 2. 데이터베이스 스키마 변경

#### users 테이블

**제거된 컬럼:**
```sql
-- 제거됨
user_username VARCHAR(50) UNIQUE NOT NULL
user_email VARCHAR(255) UNIQUE NOT NULL
```

**추가된 컬럼:**
```sql
-- 추가됨
user_intra_id VARCHAR(50) UNIQUE NOT NULL
```

#### 새로운 테이블: slack_verifications

```sql
CREATE TABLE slack_verifications (
  id SERIAL PRIMARY KEY,
  intra_id VARCHAR(50) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  slack_user_id VARCHAR(255),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);
```

### 3. API 엔드포인트 변경

#### 새로운 엔드포인트

- `POST /auth/send-verification` - Slack DM으로 인증 코드 전송
- `POST /auth/verify-code` - 인증 코드 확인

#### 변경된 엔드포인트

**POST /auth/register**

이전:
```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "Pass1234!",
  "name": "홍길동"
}
```

현재:
```json
{
  "name": "홍길동",
  "intraId": "jsmith",
  "password": "Pass1234!",
  "verificationCode": "123456"
}
```

**POST /auth/login**

이전:
```json
{
  "username": "user123",
  "password": "Pass1234!"
}
```

현재:
```json
{
  "intraId": "jsmith",
  "password": "Pass1234!"
}
```

### 4. 프론트엔드 변경

#### RegisterPage

**변경 전:**
- username, email, password 입력

**변경 후:**
- name, intraId, password 입력
- "인증코드 전송" 버튼 추가
- 인증 코드 입력 필드 추가
- "인증 확인" 버튼 추가
- 3단계 회원가입 플로우

#### LoginPage

**변경 전:**
- username 입력

**변경 후:**
- intraId 입력

#### AuthContext

**변경 전:**
```typescript
interface User {
  userId: number;
  username: string;
  email: string;
  name: string;
  role: Role;
}
```

**변경 후:**
```typescript
interface User {
  userId: number;
  intraId: string;
  name: string;
  role: Role;
}
```

### 5. 백엔드 서비스 추가

#### SlackService (새로 추가)

**파일:** `backend/src/auth/services/slack.service.ts`

**주요 기능:**
- Slack 사용자 검색 (display_name, real_name 매칭)
- 6자리 랜덤 코드 생성
- Slack DM 전송 (conversations.open + chat.postMessage)
- 인증 코드 검증
- 인증 데이터 관리

#### DTOs (새로 추가)

- `SendVerificationDto` - 인증 코드 전송 요청
- `VerifyCodeDto` - 인증 코드 확인 요청
- `RegisterDto` - 회원가입 요청 (verificationCode 추가)

### 6. Rate Limiting 추가

| 엔드포인트 | 제한 | TTL |
|-----------|-----|-----|
| `/auth/send-verification` | 3회 | 60초 |
| `/auth/verify-code` | 10회 | 60초 |
| `/auth/register` | 3회 | 1시간 |
| `/auth/login` | 5회 | 60초 |

### 7. 환경변수 추가

**backend/.env.example:**
```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
```

## 마이그레이션 가이드

### 데이터베이스 마이그레이션

기존 사용자 데이터를 유지하려면 다음 마이그레이션 필요:

```sql
-- 1. 새 컬럼 추가
ALTER TABLE users ADD COLUMN user_intra_id VARCHAR(50);

-- 2. 기존 username을 intraId로 복사 (또는 수동 매핑)
UPDATE users SET user_intra_id = user_username;

-- 3. NOT NULL 및 UNIQUE 제약 추가
ALTER TABLE users ALTER COLUMN user_intra_id SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_intra_id_unique UNIQUE (user_intra_id);

-- 4. 인덱스 추가
CREATE INDEX idx_users_intra_id ON users(user_intra_id);

-- 5. 기존 컬럼 제거
ALTER TABLE users DROP COLUMN user_username;
ALTER TABLE users DROP COLUMN user_email;

-- 6. slack_verifications 테이블 생성
CREATE TABLE slack_verifications (
  id SERIAL PRIMARY KEY,
  intra_id VARCHAR(50) NOT NULL,
  verification_code VARCHAR(6) NOT NULL,
  slack_user_id VARCHAR(255),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_slack_verifications_intra_id ON slack_verifications(intra_id);
CREATE INDEX idx_slack_verifications_expires ON slack_verifications(expires_at);
```

### 환경 설정

1. Slack App 생성 및 Bot Token 발급
2. `backend/.env`에 `SLACK_BOT_TOKEN` 추가
3. 백엔드 재시작

자세한 설정 방법은 [Slack 인증 가이드](./features/slack-verification.md) 참고

### 프론트엔드 마이그레이션

- localStorage의 사용자 정보 스키마 변경
- 기존 로그인 세션 무효화됨
- 사용자 재로그인 필요

## 영향받는 파일

### Backend

**새로 추가된 파일:**
- `src/auth/services/slack.service.ts`
- `src/auth/entities/slack-verification.entity.ts`
- `src/auth/dto/send-verification.dto.ts`
- `src/auth/dto/verify-code.dto.ts`

**수정된 파일:**
- `src/user/entities/user.entity.ts`
- `src/user/user.service.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.module.ts`
- `src/auth/dto/register.dto.ts`
- `src/auth/dto/login.dto.ts`
- `src/user/dto/create-user.dto.ts`
- `src/reservation/reservation.service.ts`
- `scripts/create-admin.ts`
- `.env.example`
- `package.json` (axios 추가)

### Frontend

**수정된 파일:**
- `src/pages/RegisterPage.tsx`
- `src/pages/LoginPage.tsx`
- `src/contexts/AuthContext.tsx`

### Documentation

**새로 추가된 문서:**
- `docs/features/slack-verification.md`
- `docs/CHANGELOG_SLACK_AUTH.md`

**업데이트 필요한 문서:**
- `docs/development/database.md`
- `docs/setup/environment.md`
- `docs/features/authentication.md`
- `docs/development/api-guide.md`

## Commits

변경사항은 다음 5개의 커밋으로 구성:

1. `refactor: 사용자 스키마 변경 - email/username을 intraId로 통합`
2. `feat: 슬랙 인증 시스템 구현`
3. `feat: 슬랙 인증 기반 회원가입 API 구현`
4. `feat: 슬랙 인증 기반 회원가입 UI 구현`
5. `fix: 레거시 파일의 User 스키마 참조 업데이트`

## Breaking Changes

⚠️ **주요 호환성 없는 변경사항:**

1. **API 스키마 변경**: 회원가입/로그인 API 요청/응답 형식 변경
2. **데이터베이스 스키마 변경**: users 테이블 컬럼 변경
3. **인증 플로우 변경**: Slack 인증 필수화
4. **환경변수 필수**: SLACK_BOT_TOKEN 필수

## 롤백 방법

변경사항을 되돌리려면:

```bash
# Git에서 이전 상태로 복원
git revert HEAD~5..HEAD

# 또는 특정 커밋으로 리셋
git reset --hard <commit-hash-before-changes>

# 데이터베이스 복원 (백업이 있는 경우)
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

## 참고 문서

- [Slack 인증 가이드](./features/slack-verification.md)
- [환경변수 설정](./setup/environment.md)
- [데이터베이스 스키마](./development/database.md)
- [API 가이드](./development/api-guide.md)
