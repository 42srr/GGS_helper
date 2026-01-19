# 시스템 아키텍처

GGS Helper의 시스템 아키텍처와 프로젝트 구조를 설명합니다.

## 목차

- [개요](#개요)
- [시스템 구성도](#시스템-구성도)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [아키텍처 패턴](#아키텍처-패턴)
- [데이터 흐름](#데이터-흐름)
- [보안 아키텍처](#보안-아키텍처)

## 개요

GGS Helper는 **3-Tier 아키텍처** 기반의 웹 애플리케이션입니다:

1. **Presentation Layer** (Frontend): React + TypeScript
2. **Application Layer** (Backend): NestJS + TypeORM
3. **Data Layer** (Database): PostgreSQL

## 시스템 구성도

```
┌──────────────────┐
│   User Browser   │
│  (localhost:6111)│
└────────┬─────────┘
         │ HTTP/REST API
         │
┌────────▼─────────┐      ┌──────────────────┐
│  Frontend (Vite) │      │  Static Files    │
│  React 18 + TS   │◄─────│  (Checkout Photos)│
└────────┬─────────┘      └──────────────────┘
         │ Fetch API
         │ JWT Bearer Token
         │
┌────────▼─────────┐
│ Backend (NestJS) │
│  (localhost:6112)│
│                  │
│  ┌────────────┐  │
│  │   Auth     │  │
│  │  (JWT)     │  │
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │Controllers │  │
│  └─────┬──────┘  │
│        │         │
│  ┌─────▼──────┐  │
│  │  Services  │  │
│  └─────┬──────┘  │
│        │         │
│  ┌─────▼──────┐  │
│  │  Entities  │  │
│  │ (TypeORM)  │  │
│  └─────┬──────┘  │
└────────┼─────────┘
         │ TypeORM
         │
┌────────▼─────────┐
│   PostgreSQL 16  │
│  (localhost:6113)│
│                  │
│  ┌────────────┐  │
│  │   Tables   │  │
│  │  - users   │  │
│  │  - rooms   │  │
│  │  - reservations│
│  └────────────┘  │
└──────────────────┘
```

## 기술 스택

### Frontend

| 카테고리 | 기술 | 역할 |
|---------|------|------|
| **코어** | React 18 | UI 라이브러리 |
| **언어** | TypeScript | 타입 안정성 |
| **빌드** | Vite | 빠른 개발 서버 & 번들링 |
| **라우팅** | React Router v6 | SPA 라우팅 |
| **상태 관리** | Context API | 인증 상태 관리 |
| **UI** | Shadcn/ui | 컴포넌트 라이브러리 |
| **스타일** | Tailwind CSS | 유틸리티 CSS |
| **HTTP** | Fetch API | API 통신 |
| **알림** | Sonner | Toast 알림 |

### Backend

| 카테고리 | 기술 | 역할 |
|---------|------|------|
| **프레임워크** | NestJS | Node.js 서버 프레임워크 |
| **언어** | TypeScript | 타입 안정성 |
| **ORM** | TypeORM | 데이터베이스 ORM |
| **인증** | JWT + Passport | 인증/인가 |
| **검증** | class-validator | DTO 검증 |
| **보안** | bcrypt | 비밀번호 해싱 |
| **Rate Limit** | @nestjs/throttler | API 요청 제한 |
| **파일 업로드** | Multer | 파일 처리 |

### Database

| 항목 | 기술 |
|-----|------|
| **DBMS** | PostgreSQL 16 |
| **컨테이너** | Docker Compose |
| **마이그레이션** | TypeORM Auto Sync |

## 프로젝트 구조

```
GGS_helper/
├── frontend/                 # 프론트엔드 애플리케이션
│   ├── public/              # 정적 파일
│   ├── src/
│   │   ├── components/      # React 컴포넌트
│   │   │   ├── ui/         # 재사용 가능한 UI 컴포넌트
│   │   │   ├── layout/     # 레이아웃 컴포넌트
│   │   │   └── ...
│   │   ├── pages/          # 페이지 컴포넌트
│   │   │   ├── admin/      # 관리자 페이지
│   │   │   └── ...
│   │   ├── contexts/       # React Context (인증)
│   │   ├── services/       # API 서비스 레이어
│   │   ├── types/          # TypeScript 타입 정의
│   │   ├── lib/            # 유틸리티 함수
│   │   ├── App.tsx         # 루트 컴포넌트
│   │   └── main.tsx        # 엔트리 포인트
│   ├── .env                # 환경변수
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts      # Vite 설정
│
├── backend/                 # 백엔드 애플리케이션
│   ├── src/
│   │   ├── admin/          # 관리자 기능 모듈
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   ├── auth/           # 인증 모듈
│   │   │   ├── guards/     # JWT, Role Guards
│   │   │   ├── strategies/ # Passport 전략
│   │   │   └── dto/
│   │   ├── user/           # 사용자 모듈
│   │   ├── room/           # 회의실 모듈
│   │   ├── reservation/    # 예약 모듈
│   │   ├── common/         # 공통 유틸리티
│   │   │   ├── guards/
│   │   │   ├── decorators/
│   │   │   └── filters/
│   │   ├── app.module.ts   # 루트 모듈
│   │   └── main.ts         # 엔트리 포인트
│   ├── uploads/            # 업로드 파일 저장
│   ├── backups/            # 데이터베이스 백업
│   ├── .env                # 환경변수
│   ├── package.json
│   └── tsconfig.json
│
├── developments/            # 개발 환경 설정
│   ├── docker-compose.yml  # PostgreSQL 컨테이너
│   └── .env                # Docker 환경변수
│
└── docs/                   # 문서
    ├── setup/              # 설치 가이드
    ├── development/        # 개발 가이드
    ├── features/           # 기능 문서
    ├── deployment/         # 배포 가이드
    └── maintenance/        # 운영 가이드
```

## 아키텍처 패턴

### 백엔드: Layered Architecture

```
┌─────────────────────────────────┐
│        Controllers              │  ← HTTP 요청 처리, DTO 검증
│  (Presentation Layer)           │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│         Services                │  ← 비즈니스 로직
│  (Business Logic Layer)         │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│   Repositories (TypeORM)        │  ← 데이터 접근
│  (Data Access Layer)            │
└────────────┬────────────────────┘
             │
┌────────────▼────────────────────┐
│         Database                │
└─────────────────────────────────┘
```

### NestJS 모듈 구조

각 도메인은 독립적인 모듈로 구성:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [DomainController],
  providers: [DomainService],
  exports: [DomainService], // 다른 모듈에서 사용 가능
})
export class DomainModule {}
```

### 프론트엔드: Component-Based Architecture

```
App (ErrorBoundary)
 │
 ├── AuthProvider (Context)
 │    │
 │    └── Router
 │         │
 │         ├── Layout
 │         │    ├── Header
 │         │    ├── Navigation
 │         │    └── Page Content
 │         │
 │         └── Routes
 │              ├── Public Routes
 │              │    ├── LoginPage
 │              │    ├── RegisterPage
 │              │    └── PublicReservationsPage
 │              │
 │              └── Protected Routes
 │                   ├── User Pages
 │                   │    ├── ReservationsPage
 │                   │    └── MyReservationsPage
 │                   │
 │                   └── Admin Pages
 │                        ├── AdminDashboard
 │                        ├── AdminReservations
 │                        ├── AdminRooms
 │                        └── AdminUsers
```

## 데이터 흐름

### 1. 사용자 로그인 플로우

```
User Input
    │
    ▼
LoginPage (Frontend)
    │ POST /auth/login
    ▼
AuthController (Backend)
    │
    ▼
AuthService.validateUser()
    │ bcrypt.compare()
    ▼
UserService.findByUsername()
    │ TypeORM Query
    ▼
PostgreSQL
    │ User data
    ▼
AuthService.login()
    │ JWT.sign()
    ▼
Response { accessToken, user }
    │
    ▼
AuthContext.login() (Frontend)
    │ localStorage.setItem()
    ▼
Navigate to Dashboard
```

### 2. 예약 생성 플로우

```
User Input (Form)
    │
    ▼
ReservationPage (Frontend)
    │ POST /reservations
    │ Authorization: Bearer <token>
    ▼
JwtAuthGuard (Backend)
    │ JWT.verify()
    ▼
ReservationController.create()
    │ ValidationPipe (DTO)
    ▼
ReservationService.create()
    │ Check conflicts
    │ Check room availability
    ▼
ReservationRepository.save()
    │ TypeORM Insert
    ▼
PostgreSQL
    │ New reservation
    ▼
Response { reservation }
    │
    ▼
Toast notification (Frontend)
    │
    ▼
Navigate to My Reservations
```

### 3. 관리자 권한 체크 플로우

```
API Request
    │ Authorization: Bearer <token>
    ▼
JwtAuthGuard
    │ Extract user from token
    ▼
RolesGuard
    │ Check user.role === 'admin'
    ▼
Authorized / Forbidden
```

## 보안 아키텍처

### 인증 흐름

```
┌──────────┐                    ┌──────────┐
│  Client  │                    │  Server  │
└────┬─────┘                    └────┬─────┘
     │                               │
     │  POST /auth/login             │
     │  { username, password }       │
     ├──────────────────────────────>│
     │                               │
     │                        Validate credentials
     │                        Generate JWT
     │                               │
     │  { accessToken, user }        │
     │<──────────────────────────────┤
     │                               │
Store token in localStorage        │
     │                               │
     │  GET /reservations            │
     │  Authorization: Bearer <token>│
     ├──────────────────────────────>│
     │                               │
     │                        Verify JWT
     │                        Extract user
     │                               │
     │  { reservations }             │
     │<──────────────────────────────┤
```

### 보안 레이어

1. **네트워크 레벨**
   - CORS 설정으로 허용된 Origin만 접근
   - Rate Limiting (60초당 100 요청)

2. **인증 레벨**
   - JWT Bearer Token
   - Token Blacklist (로그아웃 시)
   - bcrypt 비밀번호 해싱 (salt rounds: 10)

3. **인가 레벨**
   - Role-based Access Control (RBAC)
   - Route Guards (JwtAuthGuard, RolesGuard)
   - Frontend Route Protection

4. **데이터 레벨**
   - TypeORM SQL Injection 방지
   - DTO Validation (class-validator)
   - XSS 방지 (입력 검증)

### 권한 체계

```
Role: student
  ├── 예약 생성
  ├── 내 예약 조회
  ├── 내 예약 취소
  └── 체크아웃 인증

Role: staff
  ├── student 권한 전체
  └── (추가 권한 없음)

Role: admin
  ├── 전체 예약 관리 (조회, 승인, 취소)
  ├── 회의실 관리 (생성, 수정, 삭제)
  ├── 사용자 관리 (조회, 권한 수정)
  ├── 통계 및 리포트
  └── 백업/복원
```

## 성능 최적화

### 프론트엔드

- **Code Splitting**: React Router의 lazy loading
- **빌드 최적화**: Vite의 Tree Shaking 및 minification
- **이미지 최적화**: 적절한 이미지 포맷 및 크기
- **캐싱**: Browser localStorage for auth token

### 백엔드

- **데이터베이스 쿼리 최적화**
  - Eager/Lazy Loading 전략
  - 인덱스 활용
  - N+1 쿼리 방지

- **Response 최적화**
  - 필요한 필드만 반환 (select)
  - 페이지네이션

- **메모리 관리**
  - 인메모리 Token Blacklist (프로덕션에서는 Redis 권장)

## 확장성 고려사항

### 수평 확장 (Horizontal Scaling)

현재는 단일 서버 구조이지만, 확장을 위해서는:

1. **Stateless 백엔드**: JWT 사용으로 이미 Stateless
2. **공유 세션 저장소**: Redis 도입 (Token Blacklist)
3. **파일 저장소**: S3 등 클라우드 스토리지 (현재는 로컬)
4. **로드 밸런서**: Nginx 또는 클라우드 LB

### 마이크로서비스 전환 고려사항

추후 트래픽 증가 시 도메인별 분리 가능:
- Auth Service
- User Service
- Reservation Service
- Room Service

## 다음 단계

- [API 가이드](./api-guide.md) - API 엔드포인트 상세
- [데이터베이스 스키마](./database.md) - 테이블 구조
- [프론트엔드 구조](./frontend.md) - 컴포넌트 설계
- [코딩 스타일 가이드](./coding-style.md) - 코드 컨벤션
