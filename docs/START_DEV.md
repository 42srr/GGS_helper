# 개발 환경 셋팅 가이드

> GGS Helper 프로젝트를 로컬 개발 환경에서 실행하기 위한 가이드

## 목차

- [필수 요구사항](#필수-요구사항)
- [설치 및 실행](#설치-및-실행)
- [환경변수 설정](#환경변수-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [개발 서버 실행](#개발-서버-실행)
- [접속 정보](#접속-정보)
- [관리자 계정 생성](#관리자-계정-생성)
- [문제 해결](#문제-해결)

---

## 필수 요구사항

프로젝트를 실행하기 위해 다음 소프트웨어가 필요합니다.

### 필수 설치 항목

- **Node.js** 18 이상 ([다운로드](https://nodejs.org/))
- **npm** 9 이상 (Node.js와 함께 설치됨)
- **Docker** 및 **Docker Compose** ([다운로드](https://www.docker.com/))
- **Git** ([다운로드](https://git-scm.com/))

### 선택 설치 항목

- **PostgreSQL 16** (Docker 사용하지 않는 경우)
- **VS Code** 또는 다른 코드 에디터

---

## 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd GGS_helper
```

### 2. 의존성 설치

```bash
# 백엔드 의존성 설치
cd backend
npm install

# 프론트엔드 의존성 설치
cd ../frontend
npm install

# 루트로 돌아가기
cd ..
```

---

## 환경변수 설정

### Backend 환경변수

`backend/.env` 파일을 생성하고 다음 내용을 입력합니다.

```bash
# backend/.env.example을 복사하여 수정
cp backend/.env.example backend/.env
```

**`backend/.env` 파일 내용**:

```env
# 서버 설정
NODE_ENV=development
PORT=6112

# 데이터베이스 설정
DATABASE_HOST=localhost
DATABASE_PORT=6113
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ggs_helper

# JWT 설정
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d

# CORS 설정
FRONTEND_URL=http://localhost:6111

# Slack 설정은 더 이상 사용되지 않습니다.
```

**중요**:
- `JWT_SECRET`은 보안을 위해 반드시 변경해야 합니다.

### Frontend 환경변수

`frontend/.env` 파일을 생성합니다.

```bash
# frontend/.env.example을 복사하여 수정
cp frontend/.env.example frontend/.env
```

**`frontend/.env` 파일 내용**:

```env
VITE_API_BASE_URL=http://localhost:6112
```

---

## 데이터베이스 설정

### Docker를 사용하는 경우 (권장)

1. **developments/.env 파일 설정**

```bash
cd developments
cp .env.example .env
```

**`developments/.env` 파일 내용**:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ggs_helper
POSTGRES_PORT=6113
```

2. **Docker Compose로 데이터베이스 시작**

```bash
cd developments
docker-compose up -d
```

3. **데이터베이스 상태 확인**

```bash
docker-compose ps
```

`ggs_helper_db` 컨테이너가 `Up` 상태여야 합니다.

### Docker를 사용하지 않는 경우

PostgreSQL 16을 직접 설치하고 다음과 같이 데이터베이스를 생성합니다.

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE ggs_helper;

# 종료
\q
```

---

## 개발 서버 실행

### 방법 1: 터미널 2개 사용 (권장)

**터미널 1 - 백엔드 실행**:

```bash
cd backend
npm run start:dev
```

백엔드 서버가 `http://localhost:6112`에서 실행됩니다.

**터미널 2 - 프론트엔드 실행**:

```bash
cd frontend
npm run dev
```

프론트엔드 서버가 `http://localhost:6111`에서 실행됩니다.

### 방법 2: 백그라운드 실행

```bash
# 백엔드 백그라운드 실행
cd backend
npm run start:dev &

# 프론트엔드 실행
cd ../frontend
npm run dev
```

---

## 접속 정보

프로젝트가 정상적으로 실행되면 다음 주소에서 접속할 수 있습니다.

| 서비스              | URL                              | 설명                      |
| ------------------- | -------------------------------- | ------------------------- |
| **Frontend**        | http://localhost:6111            | 사용자 웹 인터페이스      |
| **Backend API**     | http://localhost:6112            | REST API 서버             |
| **Swagger API 문서** | http://localhost:6112/api-docs   | API 명세 문서 (Swagger UI) |
| **PostgreSQL**      | localhost:6113                   | 데이터베이스 (Docker)     |

---

## 관리자 계정 생성

개발 환경에서 관리자 계정을 생성하려면 다음 명령어를 실행합니다.

```bash
cd backend
npm run create-admin single
```

### 기본 관리자 계정 정보

```
인트라 ID: admin
비밀번호: Admin1234
역할: admin
```

### 다양한 관리자 계정 관리 명령어

```bash
# 단일 관리자 생성
npm run create-admin single

# 여러 관리자 생성
npm run create-admin multiple

# 기존 사용자를 관리자로 승급
npm run create-admin promote <intraId>

# 모든 사용자 목록 조회
npm run create-admin list
```

---

## 문제 해결

### 1. 백엔드 서버가 시작되지 않는 경우

**증상**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**해결 방법**:
- Docker 컨테이너가 실행 중인지 확인: `docker-compose ps`
- 컨테이너 재시작: `cd developments && docker-compose restart`
- PostgreSQL 포트 충돌 확인: `netstat -ano | findstr :5432` (Windows) 또는 `lsof -i :5432` (Mac/Linux)

### 2. 프론트엔드가 백엔드에 연결되지 않는 경우

**증상**: Network Error 또는 CORS Error

**해결 방법**:
- `frontend/.env` 파일의 `VITE_API_BASE_URL`이 `http://localhost:6112`인지 확인
- 백엔드 서버가 실행 중인지 확인: http://localhost:6112
- 브라우저 콘솔에서 에러 메시지 확인

### 3. npm install 실패

**증상**: `npm ERR! code ENOENT` 또는 패키지 설치 실패

**해결 방법**:
```bash
# npm 캐시 정리
npm cache clean --force

# node_modules 삭제 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 4. TypeScript 컴파일 에러

**증상**: `error TS2307: Cannot find module`

**해결 방법**:
```bash
# 타입 정의 재설치
cd backend
npm install --save-dev @types/node @types/express

# TypeScript 캐시 정리
rm -rf dist
npm run build
```

### 5. Docker 데이터베이스 초기화

데이터베이스를 완전히 초기화하려면:

```bash
cd developments
docker-compose down -v  # 볼륨까지 삭제
docker-compose up -d
```

### 6. Slack 연동 관련

Slack 연동 기능은 제거되었습니다. 기존 Slack 관련 환경변수는 더 이상 필요하지 않습니다.

---

## 추가 개발 도구

### VS Code 확장 프로그램 (권장)

- **ESLint**: 코드 스타일 검사
- **Prettier**: 코드 포맷팅
- **TypeScript and JavaScript Language Features**: TS 지원
- **Tailwind CSS IntelliSense**: Tailwind CSS 자동완성
- **Docker**: Docker 파일 관리

### 유용한 npm 스크립트

#### Backend

```bash
# 개발 서버 (핫 리로드)
npm run start:dev

# 프로덕션 빌드
npm run build

# 프로덕션 실행
npm run start:prod

# 테스트 실행
npm run test

# 관리자 계정 관리
npm run create-admin <command>
```

#### Frontend

```bash
# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 린트 검사
npm run lint
```

---

## 다음 단계

개발 환경 셋팅이 완료되었다면:

1. **API 문서 확인**: http://localhost:6112/api-docs
2. **데이터베이스 스키마 확인**: [TABLES.md](./TABLES.md)
3. **구현된 기능 확인**: [FEAT.md](./FEAT.md)

---

## 참고 문서

- [README.md](../README.md) - 프로젝트 개요
- [API.md](./API.md) - API 명세
- [TABLES.md](./TABLES.md) - 데이터베이스 스키마
- [FEAT.md](./FEAT.md) - 구현된 기능 목록

---

**최종 수정일**: 2026-03-18
**작성자**: GGS (42경산 개발 동아리)
