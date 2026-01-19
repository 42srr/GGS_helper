# GGS Helper (룸잇)

## 개요
회의실 및 스터디룸 예약 관리 시스템

- 회의실/스터디룸 실시간 예약 및 현황 확인
- 관리자 페이지를 통한 예약 관리, 통계, 백업 기능
- 체크아웃 인증 시스템 및 사용 후기 관리
- ReactJS, NestJS, PostgreSQL 기반의 풀스택 웹 애플리케이션

# 실행방법(개발환경)

## 1. DB 컨테이너 실행

- 도커 엔진 설치 필요
- developments/ 경로에 docker-compose.yml 파일이 존재
- .env.example 파일을 참고해서 .env 파일 생성 및 정보 입력
  ```bash
  cd developments
  cp .env.example .env
  docker compose up -d
  ```

## 2. 백엔드 및 프론트엔드 개발 서버 실행

- frontend 경로 및 backend 경로에서 npm install 명령어 실행
- .env 파일 채워넣기
- frontend 경로에서 npm run dev 명령어 실행
- backend 경로에서 npm run start:dev 명령어 실행

# 주요 기능

## 사용자 기능
- **실시간 예약 현황**: 달력 형식으로 예약 현황 확인
- **회의실 예약**: 시간대별 예약 생성 및 충돌 검증
- **체크아웃 인증**: 사진 업로드를 통한 퇴실 인증
- **예약 관리**: 내 예약 목록 조회 및 취소

## 관리자 기능
- **예약 관리**: 전체 예약 조회, 승인, 취소
- **회의실 관리**: 회의실 정보 수정, Excel 일괄 업로드
- **사용자 관리**: 회원 정보 조회, 권한 관리
- **통계**: 예약 통계 및 리포트 생성
- **백업/복원**: 데이터베이스 백업 및 복원 기능

# 기술 스택

## Frontend
- **React 18** + TypeScript
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Shadcn/ui** - UI 컴포넌트 라이브러리
- **Tailwind CSS** - 스타일링
- **Sonner** - Toast 알림

## Backend
- **NestJS** - Node.js 프레임워크
- **TypeORM** - ORM
- **JWT** - 인증/인가
- **class-validator** - DTO 검증
- **Throttler** - Rate Limiting (보안)

## Database
- **PostgreSQL 16** - 관계형 데이터베이스

## DevOps
- **Docker Compose** - 컨테이너 오케스트레이션
- **Git** - 버전 관리

## 보안 기능
- JWT 기반 인증 및 토큰 블랙리스트
- Rate Limiting (IP 기반)
- SQL Injection 방지 (TypeORM)
- XSS 방지
- 비밀번호 암호화 (bcrypt)

# 개발자

## Frontend

- yutsong
- kjung

## Backend

- yutsong
