# 환경변수 설정 가이드

GGS Helper 프로젝트의 환경변수 설정 방법과 각 변수의 역할을 설명합니다.

## 목차

- [개요](#개요)
- [백엔드 환경변수](#백엔드-환경변수)
- [프론트엔드 환경변수](#프론트엔드-환경변수)
- [개발 환경 환경변수](#개발-환경-환경변수)
- [환경별 설정](#환경별-설정)
- [보안 주의사항](#보안-주의사항)

## 개요

GGS Helper는 세 가지 환경변수 파일을 사용합니다:

1. `backend/.env` - 백엔드 서버 설정
2. `frontend/.env` - 프론트엔드 애플리케이션 설정
3. `developments/.env` - Docker 개발 환경 설정

## 백엔드 환경변수

파일 위치: `backend/.env`

### Application Environment

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `NODE_ENV` | 실행 환경 (development, production, test) | `development` | ✅ |
| `PORT` | 백엔드 서버 포트 | `6112` | ✅ |

```env
NODE_ENV=development
PORT=6112
```

### Database Configuration

PostgreSQL 데이터베이스 연결 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `DATABASE_HOST` | 데이터베이스 호스트 | `localhost` | ✅ |
| `DATABASE_PORT` | 데이터베이스 포트 | `6113` | ✅ |
| `DATABASE_USER` | 데이터베이스 사용자명 | `postgres` | ✅ |
| `DATABASE_PASSWORD` | 데이터베이스 비밀번호 | `postgres` | ✅ |
| `DATABASE_NAME` | 데이터베이스 이름 | `ggs_helper` | ✅ |

```env
DATABASE_HOST=localhost
DATABASE_PORT=6113
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ggs_helper
```

**프로덕션 환경 주의사항:**
- `DATABASE_PASSWORD`는 강력한 비밀번호로 변경 필수
- 외부 접근이 필요한 경우 `DATABASE_HOST` 변경

### JWT Configuration

인증/인가를 위한 JWT 토큰 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `JWT_SECRET` | JWT 서명 비밀키 | `your-super-secret-jwt-key-change-this-in-production` | ✅ |
| `JWT_EXPIRES_IN` | JWT 토큰 만료 시간 | `1d` | ✅ |

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
```

**JWT 비밀키 생성 방법:**

```bash
# OpenSSL 사용 (권장)
openssl rand -base64 32

# Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**만료 시간 형식:**
- `60s` - 60초
- `5m` - 5분
- `1h` - 1시간
- `1d` - 1일
- `7d` - 7일

### Frontend URL

CORS 및 리다이렉트를 위한 프론트엔드 URL 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `FRONTEND_URL` | 프론트엔드 애플리케이션 URL | `http://localhost:6111` | ✅ |

```env
FRONTEND_URL=http://localhost:6111
```

### Logging

로깅 레벨 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `LOG_LEVEL` | 로그 레벨 (debug, info, warn, error) | `debug` | ❌ |

```env
LOG_LEVEL=debug
```

개발 환경에서는 `debug`, 프로덕션에서는 `info` 또는 `warn` 권장.

### File Upload

파일 업로드 제한 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `MAX_FILE_SIZE` | 최대 파일 크기 (bytes) | `20971520` (20MB) | ❌ |

```env
MAX_FILE_SIZE=20971520  # 20MB in bytes
```

크기 계산:
- 1MB = 1,048,576 bytes
- 10MB = 10,485,760 bytes
- 20MB = 20,971,520 bytes

### Rate Limiting

API 요청 제한 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `THROTTLE_TTL` | 제한 시간 창 (초) | `60` | ❌ |
| `THROTTLE_LIMIT` | 시간 창 내 최대 요청 수 | `100` | ❌ |

```env
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

기본 설정: 60초당 100개 요청 허용

### CORS Configuration

Cross-Origin Resource Sharing 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `CORS_ORIGIN` | 허용할 Origin | `http://localhost:6111` | ✅ |
| `CORS_CREDENTIALS` | 자격증명 포함 여부 | `true` | ❌ |

```env
CORS_ORIGIN=http://localhost:6111
CORS_CREDENTIALS=true
```

**프로덕션 환경:**
- 실제 도메인으로 변경 필요 (예: `https://ggs.example.com`)

### Slack Configuration

회원가입 시 Slack 인증을 위한 Slack Bot 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `SLACK_BOT_TOKEN` | Slack Bot User OAuth Token | - | ✅ |

```env
SLACK_BOT_TOKEN=xoxb-your-slack-bot-token-here
```

**Slack Bot Token 발급 방법:**

1. [Slack API](https://api.slack.com/apps) 접속
2. "Create New App" → "From scratch" 선택
3. OAuth & Permissions에서 다음 Scopes 추가:
   - `users:read` - 사용자 정보 조회
   - `users:read.email` - 이메일 조회
   - `chat:write` - 메시지 전송
   - `im:write` - DM 전송
4. "Install to Workspace" 클릭
5. "Bot User OAuth Token" 복사 (xoxb-로 시작)

자세한 설정 방법은 [Slack 인증 가이드](../features/slack-verification.md)를 참고하세요.

### Backup Configuration

데이터베이스 백업 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `BACKUP_PATH` | 백업 파일 저장 경로 | `./backups` | ❌ |
| `BACKUP_RETENTION_DAYS` | 백업 보관 기간 (일) | `30` | ❌ |

```env
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30
```

### Optional: Email Configuration

이메일 알림 기능 (향후 구현 예정):

```env
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
# EMAIL_FROM=noreply@ggs.com
```

### Optional: Redis Configuration

토큰 블랙리스트 및 캐싱용 Redis 설정 (선택사항):

```env
# REDIS_URL=redis://localhost:6379
# REDIS_HOST=localhost
# REDIS_PORT=6379
# REDIS_PASSWORD=
```

설정하지 않으면 인메모리 블랙리스트 사용 (프로덕션 비권장).

## 프론트엔드 환경변수

파일 위치: `frontend/.env`

### API Configuration

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `VITE_API_BASE_URL` | 백엔드 API URL | `http://localhost:6112` | ✅ |

```env
VITE_API_BASE_URL=http://localhost:6112
```

**주의사항:**
- Vite 환경변수는 `VITE_` 접두사 필요
- 프론트엔드 코드에 번들링되므로 민감한 정보 포함 금지
- 빌드 시점에 값이 고정됨

### 프로덕션 빌드

프로덕션 빌드 전 `.env.production` 파일 생성:

```bash
# frontend/.env.production
VITE_API_BASE_URL=https://api.ggs.example.com
```

빌드 명령어:
```bash
npm run build  # .env.production 사용
```

## 개발 환경 환경변수

파일 위치: `developments/.env`

Docker Compose용 PostgreSQL 설정입니다.

| 변수명 | 설명 | 기본값 | 필수 |
|-------|------|-------|------|
| `POSTGRES_DB` | 생성할 데이터베이스 이름 | `ggs_helper` | ✅ |
| `POSTGRES_USER` | PostgreSQL 사용자명 | `postgres` | ✅ |
| `POSTGRES_PASSWORD` | PostgreSQL 비밀번호 | `postgres` | ✅ |

```env
POSTGRES_DB=ggs_helper
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

**주의:** 이 설정은 `backend/.env`의 `DATABASE_*` 변수와 일치해야 합니다.

## 환경별 설정

### 개발 환경 (Development)

```env
# backend/.env
NODE_ENV=development
PORT=6112
DATABASE_HOST=localhost
DATABASE_PORT=6113
FRONTEND_URL=http://localhost:6111
LOG_LEVEL=debug
```

### 테스트 환경 (Test)

```env
# backend/.env.test
NODE_ENV=test
PORT=6114
DATABASE_HOST=localhost
DATABASE_PORT=6115
DATABASE_NAME=ggs_helper_test
LOG_LEVEL=error
```

### 프로덕션 환경 (Production)

```env
# backend/.env.production
NODE_ENV=production
PORT=3000
DATABASE_HOST=your-db-host.example.com
DATABASE_PORT=5432
DATABASE_PASSWORD=strong-secure-password-here
JWT_SECRET=generated-secure-secret-key
FRONTEND_URL=https://ggs.example.com
CORS_ORIGIN=https://ggs.example.com
LOG_LEVEL=info
```

## 보안 주의사항

### 절대 공개하지 말 것

다음 변수는 절대 공개 저장소에 포함하면 안 됩니다:

- `JWT_SECRET` - JWT 토큰 변조 가능
- `DATABASE_PASSWORD` - 데이터베이스 접근 가능
- `SLACK_BOT_TOKEN` - Slack 워크스페이스 접근 및 DM 전송 가능
- `REDIS_PASSWORD` - Redis 접근 가능
- `SMTP_PASSWORD` - 이메일 계정 탈취 가능

### .env 파일 관리

```bash
# .gitignore에 포함 확인
.env
.env.local
.env.production
.env.*.local

# .env.example만 커밋
.env.example
```

### 프로덕션 배포 시

1. **환경변수 관리 서비스 사용 권장**
   - AWS Secrets Manager
   - Azure Key Vault
   - HashiCorp Vault
   - Doppler

2. **파일 권한 설정**
   ```bash
   chmod 600 .env  # 소유자만 읽기/쓰기 가능
   ```

3. **정기적인 비밀키 교체**
   - JWT_SECRET: 3-6개월마다
   - DATABASE_PASSWORD: 6-12개월마다

### 환경변수 검증

백엔드 서버는 시작 시 필수 환경변수를 자동 검증합니다. 누락된 변수가 있으면 오류 메시지와 함께 종료됩니다.

## 다음 단계

- [설치 가이드](./installation.md) - 프로젝트 설치 방법
- [Docker 설정](./docker.md) - Docker 컨테이너 관리
- [배포 가이드](../deployment/production.md) - 프로덕션 배포 방법
