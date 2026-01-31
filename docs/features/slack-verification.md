# Slack 인증 시스템

GGS Helper의 Slack 기반 회원가입 인증 시스템을 설명합니다.

## 목차

- [개요](#개요)
- [인증 흐름](#인증-흐름)
- [Slack Bot 설정](#slack-bot-설정)
- [API 엔드포인트](#api-엔드포인트)
- [데이터베이스 스키마](#데이터베이스-스키마)
- [보안 기능](#보안-기능)
- [구현 상세](#구현-상세)

## 개요

GGS Helper는 Slack 계정 인증을 통한 회원가입 시스템을 사용합니다.

### 주요 특징

- **Slack 연동**: 인트라 ID를 Slack 워크스페이스에서 검색하여 본인 확인
- **DM 인증**: Slack DM으로 6자리 인증 코드 전송
- **시간 제한**: 인증 코드는 5분간만 유효
- **중복 가입 방지**: 인트라 ID 중복 체크
- **Rate Limiting**: 스팸 방지를 위한 요청 제한

### 인증 방식 변경

**이전 (42 OAuth):**
- 42 OAuth를 통한 인증
- username, email 기반 로그인

**현재 (Slack 인증):**
- Slack Bot API를 통한 인증
- intraId 기반 로그인
- Slack DM으로 인증 코드 전송

## 인증 흐름

### 전체 회원가입 플로우

```
┌──────────────────────────────────────────────────────────┐
│ 1. 사용자 정보 입력                                        │
│    - 이름                                                 │
│    - 인트라 ID                                            │
│    - 비밀번호                                             │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 2. "인증코드 전송" 버튼 클릭                               │
│    POST /auth/send-verification                          │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 3. Slack에서 사용자 검색                                  │
│    - Slack API: users.list                               │
│    - display_name 또는 real_name 매칭                    │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 4. 6자리 랜덤 코드 생성 및 저장                           │
│    - DB: slack_verifications 테이블                      │
│    - 만료시간: 현재 + 5분                                 │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 5. Slack DM 전송                                          │
│    - conversations.open (DM 채널 열기)                   │
│    - chat.postMessage (인증 코드 전송)                   │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 6. 사용자가 Slack에서 코드 확인                           │
│    - Slack DM에서 6자리 코드 확인                         │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 7. 인증 코드 입력 및 확인                                 │
│    POST /auth/verify-code                                │
│    - 코드 일치 여부 확인                                  │
│    - 만료 시간 확인                                       │
│    - is_verified = true 설정                             │
└──────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│ 8. 회원가입 완료                                          │
│    POST /auth/register                                   │
│    - 인증 완료 여부 확인                                  │
│    - 사용자 계정 생성                                     │
│    - 인증 데이터 삭제                                     │
└──────────────────────────────────────────────────────────┘
```

### 상세 단계

#### 1단계: 인증 코드 전송

```typescript
// POST /auth/send-verification
{
  "intraId": "jsmith"
}
```

**처리 과정:**

1. 인트라 ID 검증 (영문, 숫자, -, _ 만 허용)
2. Slack API로 사용자 검색
3. 6자리 랜덤 코드 생성
4. DB에 임시 저장 (5분 TTL)
5. Slack DM 전송

**응답:**

```json
{
  "message": "인증 코드가 슬랙 DM으로 전송되었습니다. 5분 이내에 입력해주세요."
}
```

#### 2단계: 인증 코드 확인

```typescript
// POST /auth/verify-code
{
  "intraId": "jsmith",
  "code": "123456"
}
```

**검증 조건:**

- ✅ 인트라 ID 일치
- ✅ 코드 일치
- ✅ 만료 시간 이내 (5분)
- ✅ 아직 인증되지 않음

**응답 (성공):**

```json
{
  "success": true,
  "message": "인증이 완료되었습니다."
}
```

**응답 (실패):**

```json
{
  "success": false,
  "message": "인증 코드가 올바르지 않거나 만료되었습니다."
}
```

#### 3단계: 회원가입

```typescript
// POST /auth/register
{
  "name": "John Smith",
  "intraId": "jsmith",
  "password": "SecurePass123",
  "verificationCode": "123456"
}
```

**검증 조건:**

- ✅ Slack 인증 완료 여부 확인
- ✅ 인트라 ID 중복 체크
- ✅ 비밀번호 복잡도 (8자 이상, 대소문자+숫자)
- ✅ 만료 시간 이내

**응답:**

```json
{
  "message": "회원가입이 완료되었습니다. 로그인해주세요."
}
```

## Slack Bot 설정

### 1. Slack App 생성

1. [Slack API](https://api.slack.com/apps) 접속
2. "Create New App" 클릭
3. "From scratch" 선택
4. App 이름 입력 (예: "GGS Helper")
5. 워크스페이스 선택

### 2. Bot 권한 설정

**OAuth & Permissions > Scopes:**

필요한 Bot Token Scopes:

- `users:read` - 사용자 정보 조회
- `users:read.email` - 이메일 주소 조회
- `chat:write` - 메시지 전송
- `im:write` - DM 전송

### 3. Bot Token 발급

1. "Install to Workspace" 클릭
2. 권한 승인
3. "Bot User OAuth Token" 복사
   - 형식: `xoxb-xxxxxxxxxxxxx-xxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx`

### 4. 환경변수 설정

```bash
# backend/.env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
```

### 5. 워크스페이스에 Bot 추가

Slack 워크스페이스에서:

1. Apps 섹션으로 이동
2. "GGS Helper" bot 추가
3. (선택) 채널에 초대: `/invite @GGS Helper`

## API 엔드포인트

### POST /auth/send-verification

인증 코드를 Slack DM으로 전송합니다.

**Request:**

```json
{
  "intraId": "jsmith"
}
```

**Response (200):**

```json
{
  "message": "인증 코드가 슬랙 DM으로 전송되었습니다. 5분 이내에 입력해주세요."
}
```

**Response (400):**

```json
{
  "statusCode": 400,
  "message": "Slack에서 해당 인트라 ID를 찾을 수 없습니다",
  "error": "Bad Request"
}
```

**Rate Limit:** 60초에 3번

### POST /auth/verify-code

인증 코드를 확인합니다.

**Request:**

```json
{
  "intraId": "jsmith",
  "code": "123456"
}
```

**Response (200 - 성공):**

```json
{
  "success": true,
  "message": "인증이 완료되었습니다."
}
```

**Response (200 - 실패):**

```json
{
  "success": false,
  "message": "인증 코드가 올바르지 않거나 만료되었습니다."
}
```

**Rate Limit:** 60초에 10번

### POST /auth/register

회원가입을 완료합니다.

**Request:**

```json
{
  "name": "John Smith",
  "intraId": "jsmith",
  "password": "SecurePass123",
  "verificationCode": "123456"
}
```

**Response (201):**

```json
{
  "message": "회원가입이 완료되었습니다. 로그인해주세요."
}
```

**Response (400 - 인증 미완료):**

```json
{
  "statusCode": 400,
  "message": "인증 코드가 유효하지 않거나 만료되었습니다. 인증 코드를 다시 요청해주세요.",
  "error": "Bad Request"
}
```

**Response (409 - 중복):**

```json
{
  "statusCode": 409,
  "message": "해당 인트라 ID는 이미 사용 중입니다",
  "error": "Conflict"
}
```

**Rate Limit:** 1시간에 3번

### POST /auth/login

로그인 (인트라 ID 기반).

**Request:**

```json
{
  "intraId": "jsmith",
  "password": "SecurePass123"
}
```

**Response (200):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "intraId": "jsmith",
    "name": "John Smith",
    "role": "student"
  }
}
```

## 데이터베이스 스키마

### slack_verifications 테이블

임시 인증 코드를 저장합니다 (5분 TTL).

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

CREATE INDEX idx_slack_verifications_intra_id ON slack_verifications(intra_id);
CREATE INDEX idx_slack_verifications_expires ON slack_verifications(expires_at);
```

**컬럼 설명:**

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INTEGER | Primary Key |
| `intra_id` | VARCHAR(50) | 인트라 ID |
| `verification_code` | VARCHAR(6) | 6자리 인증 코드 |
| `slack_user_id` | VARCHAR(255) | Slack 사용자 ID (선택) |
| `is_verified` | BOOLEAN | 인증 완료 여부 |
| `created_at` | TIMESTAMP | 생성 시각 |
| `expires_at` | TIMESTAMP | 만료 시각 (created_at + 5분) |

**Lifecycle:**

1. **생성**: 인증 코드 전송 시
2. **검증**: 사용자가 코드 입력 시 `is_verified = true`
3. **삭제**: 회원가입 완료 시 또는 만료 시

### users 테이블 변경사항

**제거된 컬럼:**

- ❌ `user_email` - 이메일 제거
- ❌ `user_username` - username 제거

**추가된 컬럼:**

- ✅ `user_intra_id` - 인트라 ID (Unique, 로그인 시 사용)

```sql
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  user_intra_id VARCHAR(50) UNIQUE NOT NULL,
  user_password VARCHAR(255) NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  user_phone VARCHAR(20),
  user_role VARCHAR(20) NOT NULL DEFAULT 'student',
  user_isavailable BOOLEAN NOT NULL DEFAULT true,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  late_count INTEGER NOT NULL DEFAULT 0,
  is_reservation_banned BOOLEAN NOT NULL DEFAULT false,
  ban_until TIMESTAMP,
  user_createdat TIMESTAMP NOT NULL DEFAULT NOW(),
  user_updatedat TIMESTAMP NOT NULL DEFAULT NOW(),
  user_lastloginat TIMESTAMP
);

CREATE INDEX idx_users_intra_id ON users(user_intra_id);
```

## 보안 기능

### 1. Rate Limiting

스팸 및 Brute Force 공격 방지:

| 엔드포인트 | 제한 | TTL | 목적 |
|-----------|-----|-----|------|
| `/auth/send-verification` | 3회 | 60초 | DM 스팸 방지 |
| `/auth/verify-code` | 10회 | 60초 | 코드 무차별 대입 방지 |
| `/auth/register` | 3회 | 1시간 | 계정 스팸 방지 |
| `/auth/login` | 5회 | 60초 | Brute Force 방지 |

### 2. 입력 검증

**인트라 ID 규칙:**

```typescript
// 영문, 숫자, -, _ 만 허용
const intraIdRegex = /^[a-zA-Z0-9_-]+$/;
```

**비밀번호 복잡도:**

```typescript
// 8자 이상, 대문자+소문자+숫자 포함
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
const minLength = 8;
```

**인증 코드:**

- 정확히 6자리
- 숫자만 허용

### 3. 시간 제한

- **코드 유효 시간**: 5분
- **자동 정리**: 만료된 코드는 주기적으로 삭제 (선택 구현)

### 4. 중복 방지

- **인트라 ID**: Unique constraint로 중복 가입 방지
- **코드 재전송**: 기존 코드 덮어쓰기 (같은 intraId)

## 구현 상세

### SlackService

**파일:** `backend/src/auth/services/slack.service.ts`

주요 메서드:

```typescript
class SlackService {
  // 인증 코드 전송 (전체 플로우)
  async sendVerificationCode(intraId: string): Promise<void>

  // Slack 사용자 검색
  private async findSlackUserByIntraId(intraId: string): Promise<string>

  // Slack DM 전송
  private async sendSlackDM(slackUserId: string, code: string): Promise<void>

  // 6자리 랜덤 코드 생성
  private generateVerificationCode(): string

  // 코드 검증
  async verifyCode(intraId: string, code: string): Promise<boolean>

  // 인증 완료 여부 확인
  async isCodeVerified(intraId: string): Promise<boolean>

  // 인증 데이터 삭제
  async deleteVerification(intraId: string): Promise<void>
}
```

### 코드 생성 로직

```typescript
private generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
```

- 범위: 100000 ~ 999999
- 정확히 6자리 보장

### Slack API 호출

**사용자 검색:**

```typescript
const response = await axios.get('https://slack.com/api/users.list', {
  headers: {
    'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
  },
});

// display_name 또는 real_name 매칭
const user = response.data.members.find(
  (member: any) =>
    !member.deleted &&
    !member.is_bot &&
    (member.profile.display_name === intraId ||
     member.real_name === intraId)
);
```

**DM 채널 열기:**

```typescript
const channelResponse = await axios.post(
  'https://slack.com/api/conversations.open',
  { users: slackUserId },
  {
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }
);
```

**메시지 전송:**

```typescript
await axios.post(
  'https://slack.com/api/chat.postMessage',
  {
    channel: channelId,
    text: `🔐 GGS Helper 회원가입 인증 코드\n\n인증 코드: *${verificationCode}*\n\n이 코드는 5분간 유효합니다.`,
  },
  {
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
  }
);
```

## 프론트엔드 구현

### RegisterPage UI Flow

**파일:** `frontend/src/pages/RegisterPage.tsx`

**상태 관리:**

```typescript
const [formData, setFormData] = useState({
  name: '',
  intraId: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
});
const [codeSent, setCodeSent] = useState(false);
const [isVerified, setIsVerified] = useState(false);
const [isVerifying, setIsVerifying] = useState(false);
```

**3단계 UI:**

1. **intraId 입력** → "인증코드 전송" 버튼
2. **코드 입력** → "인증 확인" 버튼 (codeSent=true일 때만 표시)
3. **회원가입 버튼** → isVerified=true일 때만 활성화

## 트러블슈팅

### Slack에서 사용자를 찾을 수 없음

**원인:**

- Slack 프로필의 display_name이 인트라 ID와 다름
- real_name과도 일치하지 않음

**해결:**

1. Slack 프로필에서 "표시 이름" 확인
2. 인트라 ID와 정확히 일치하도록 수정
3. 또는 SlackService 수정하여 추가 필드 검색

### 인증 코드가 전송되지 않음

**확인 사항:**

- [ ] SLACK_BOT_TOKEN 환경변수 설정 확인
- [ ] Bot이 워크스페이스에 설치되어 있는지 확인
- [ ] Bot 권한 확인 (`chat:write`, `users:read`)
- [ ] 네트워크 연결 확인

### 코드 만료

**기본 설정:** 5분

**연장 방법:**

```typescript
// slack.service.ts
const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분으로 변경
```

### 중복 인트라 ID

**에러:**

```
해당 인트라 ID는 이미 사용 중입니다
```

**해결:**

- 해당 인트라 ID로 이미 가입된 계정 존재
- 로그인 시도 또는 관리자에게 문의

## 다음 단계

- [인증 시스템](./authentication.md) - JWT 인증
- [환경변수 설정](../setup/environment.md) - Slack Bot Token 설정
- [API 가이드](../development/api-guide.md) - API 상세
