# 설치 가이드

GGS Helper 프로젝트의 상세 설치 가이드입니다.

## 목차

- [사전 요구사항](#사전-요구사항)
- [저장소 클론](#저장소-클론)
- [환경 설정](#환경-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [의존성 설치](#의존성-설치)
- [애플리케이션 실행](#애플리케이션-실행)
- [설치 확인](#설치-확인)
- [문제 해결](#문제-해결)

## 사전 요구사항

### 필수 소프트웨어

| 소프트웨어 | 최소 버전 | 권장 버전 | 확인 명령어 |
|-----------|---------|---------|------------|
| Node.js | 18.0.0 | 20.x | `node --version` |
| npm | 9.0.0 | 10.x | `npm --version` |
| Docker | 20.10.0 | 24.x | `docker --version` |
| Docker Compose | 2.0.0 | 2.x | `docker-compose --version` |
| Git | 2.30.0 | 2.x | `git --version` |

### 시스템 요구사항

- **운영체제**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)
- **메모리**: 최소 4GB RAM (권장 8GB)
- **디스크 공간**: 최소 2GB 여유 공간

## 저장소 클론

```bash
# HTTPS 방식
git clone <repository-url>

# SSH 방식 (권장)
git clone git@github.com:<username>/GGS_helper.git

# 프로젝트 디렉토리로 이동
cd GGS_helper
```

## 환경 설정

각 서비스의 환경변수 파일을 생성합니다.

### 1. 백엔드 환경변수

```bash
cp backend/.env.example backend/.env
```

기본 설정은 로컬 개발 환경에 최적화되어 있습니다. 필요시 [환경변수 설정 가이드](./environment.md)를 참조하여 수정하세요.

### 2. 프론트엔드 환경변수

```bash
cp frontend/.env.example frontend/.env
```

### 3. 개발 환경 환경변수

```bash
cp developments/.env.example developments/.env
```

## 데이터베이스 설정

Docker를 사용하여 PostgreSQL 데이터베이스를 설정합니다.

### Docker Compose 실행

```bash
cd developments
docker-compose up -d
```

### 데이터베이스 연결 확인

```bash
docker-compose ps
```

정상 실행 시 출력 예시:
```
NAME                    STATUS    PORTS
ggs_helper_postgres     Up        0.0.0.0:6113->5432/tcp
```

### 데이터베이스 초기화

백엔드 서버 첫 실행 시 TypeORM이 자동으로 테이블을 생성합니다.

## 의존성 설치

### 백엔드 의존성

```bash
cd backend
npm install
```

### 프론트엔드 의존성

```bash
cd frontend
npm install
```

## 애플리케이션 실행

### 개발 모드 실행

두 개의 터미널을 사용하여 백엔드와 프론트엔드를 각각 실행합니다.

#### 터미널 1: 백엔드 서버

```bash
cd backend
npm run start:dev
```

서버 실행 확인 메시지:
```
[Nest] INFO [NestFactory] Starting Nest application...
[Nest] INFO [RoutesResolver] Mapped {/api/auth/*, ...
Application is running on: http://localhost:6112
```

#### 터미널 2: 프론트엔드 개발 서버

```bash
cd frontend
npm run dev
```

서버 실행 확인 메시지:
```
VITE v5.x ready in xxx ms

➜  Local:   http://localhost:6111/
➜  Network: use --host to expose
```

## 설치 확인

### 1. 웹 애플리케이션 접속

브라우저에서 [http://localhost:6111](http://localhost:6111)에 접속합니다.

### 2. 관리자 계정 로그인

기본 관리자 계정으로 로그인을 테스트합니다:

```
이메일: admin@ggs.com
사용자 ID: admin
비밀번호: Admin1234!
```

### 3. API 서버 확인

백엔드 API 서버가 정상 작동하는지 확인합니다:

```bash
curl http://localhost:6112/health
```

정상 응답 예시:
```json
{"status":"ok"}
```

### 4. 데이터베이스 연결 확인

PostgreSQL 데이터베이스에 직접 연결하여 테이블이 생성되었는지 확인합니다:

```bash
docker-compose exec postgres psql -U postgres -d ggs_helper -c "\dt"
```

## 문제 해결

### 포트 충돌

다른 애플리케이션이 포트를 사용 중일 때:

```bash
# Windows
netstat -ano | findstr :6111
netstat -ano | findstr :6112
netstat -ano | findstr :6113

# macOS/Linux
lsof -i :6111
lsof -i :6112
lsof -i :6113
```

해결 방법: 해당 프로세스를 종료하거나 `.env` 파일에서 다른 포트로 변경합니다.

### Docker 컨테이너 오류

기존 컨테이너 및 볼륨 삭제:

```bash
cd developments
docker-compose down -v
docker-compose up -d
```

### npm install 실패

캐시 클리어 후 재시도:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 데이터베이스 연결 실패

1. Docker 컨테이너 상태 확인:
   ```bash
   docker-compose ps
   ```

2. PostgreSQL 로그 확인:
   ```bash
   docker-compose logs postgres
   ```

3. 환경변수 확인:
   - `backend/.env`의 `DATABASE_*` 변수가 올바른지 확인

### 프론트엔드 빌드 오류

TypeScript 타입 체크:

```bash
cd frontend
npm run type-check
```

## 다음 단계

- [환경변수 설정 가이드](./environment.md) - 환경변수 상세 설명
- [Docker 설정 가이드](./docker.md) - Docker 컨테이너 관리
- [시스템 아키텍처](../development/architecture.md) - 프로젝트 구조 이해
- [개발 시작하기](../development/api-guide.md) - API 개발 가이드
