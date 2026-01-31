# 구현된 기능 목록

> GGS Helper 프로젝트에 구현된 모든 기능을 정리한 문서

## 목차

- [인증 및 사용자 관리](#인증-및-사용자-관리)
- [회의실 관리](#회의실-관리)
- [예약 시스템](#예약-시스템)
- [관리자 기능](#관리자-기능)
- [보안 기능](#보안-기능)
- [개발자 도구](#개발자-도구)

---

## 인증 및 사용자 관리

### Slack 기반 인증 시스템 ✅

**구현 완료**: 2025-01-31

Slack Bot을 이용한 사용자 인증 시스템

**주요 기능**:
- 인트라 ID로 Slack 사용자 검색
- 6자리 랜덤 인증 코드 생성 및 DM 전송
- 인증 코드 5분간 유효
- 회원가입 시 인증 코드 검증 필수

**기술 스택**:
- `@slack/web-api` - Slack API 통합
- TypeORM 엔티티 (`SlackVerification`)
- Rate Limiting (인증 코드 전송: 60초 3번, 검증: 60초 10번)

**관련 파일**:
- [backend/src/auth/services/slack.service.ts](backend/src/auth/services/slack.service.ts)
- [backend/src/auth/entities/slack-verification.entity.ts](backend/src/auth/entities/slack-verification.entity.ts)

**상세 문서**: Slack 인증 시스템 구현 완료

---

### JWT 기반 인증 ✅

**구현 완료**: 2025-01-08

JWT (JSON Web Token)를 사용한 무상태 인증 시스템

**주요 기능**:
- Access Token 기반 인증
- 토큰 블랙리스트 (로그아웃 시)
- bcrypt 비밀번호 해싱 (salt rounds: 10)
- Passport JWT 전략

**API 엔드포인트**:
- `POST /auth/login` - 로그인
- `POST /auth/logout` - 로그아웃 (토큰 블랙리스트 추가)
- `GET /auth/me` - 현재 사용자 정보 조회

**관련 파일**:
- [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)
- [backend/src/auth/guards/jwt-auth.guard.ts](backend/src/auth/guards/jwt-auth.guard.ts)

---

### 역할 기반 접근 제어 (RBAC) ✅

**구현 완료**: 2025-01-08

사용자 역할에 따른 권한 관리 시스템

**역할 종류**:
- `student`: 일반 학생 (기본값)
- `staff`: 스태프
- `admin`: 관리자

**권한 레벨**:
- student: 1
- staff: 2
- admin: 4

**주요 기능**:
- 데코레이터 기반 권한 검사 (`@Roles`, `@RequirePermissions`)
- 계층적 권한 구조 (상위 역할은 하위 권한 포함)

**관련 파일**:
- [backend/src/auth/guards/roles.guard.ts](backend/src/auth/guards/roles.guard.ts)
- [backend/src/auth/enums/role.enum.ts](backend/src/auth/enums/role.enum.ts)

---

## 회의실 관리

### 회의실 CRUD ✅

**구현 완료**: 2025-01-08

회의실 정보 생성, 조회, 수정, 삭제 기능

**주요 기능**:
- 회의실 생성 (관리자만)
- 회의실 목록 조회 (검색 기능 포함)
- 회의실 상세 정보 조회
- 회의실 정보 수정 (관리자만)
- 회의실 비활성화 (삭제 대신 `isAvailable = false`)

**API 엔드포인트**:
- `POST /rooms` - 회의실 생성
- `GET /rooms` - 회의실 목록 조회
- `GET /rooms/:id` - 회의실 상세 조회
- `PATCH /rooms/:id` - 회의실 수정
- `DELETE /rooms/:id` - 회의실 비활성화

**관련 파일**:
- [backend/src/room/room.controller.ts](backend/src/room/room.controller.ts)
- [backend/src/room/room.service.ts](backend/src/room/room.service.ts)

---

### Excel 일괄 업로드 ✅

**구현 완료**: 2025-01-08

Excel 파일을 이용한 회의실 정보 일괄 등록

**주요 기능**:
- Excel 템플릿 다운로드 (`GET /rooms/template`)
- Excel 파일 업로드 및 파싱 (`.xlsx`, `.xls` 지원)
- 기존 회의실 전체 교체 방식
- 업로드 결과 통계 (성공/실패 개수)

**기술 스택**:
- `xlsx` 라이브러리
- Multer 파일 업로드

**API 엔드포인트**:
- `GET /rooms/template` - Excel 템플릿 다운로드
- `POST /rooms/upload` - Excel 일괄 업로드
- `GET /rooms/export` - 회의실 데이터 Excel 내보내기

**관련 파일**:
- [backend/src/room/room.controller.ts](backend/src/room/room.controller.ts)
- [backend/src/room/room.service.ts](backend/src/room/room.service.ts)

---

## 예약 시스템

### 예약 CRUD ✅

**구현 완료**: 2025-01-08

회의실 예약 생성, 조회, 수정, 취소 기능

**주요 기능**:
- 예약 생성 (시간 충돌 검증)
- 예약 목록 조회 (필터링: 회의실, 날짜 범위)
- 내 예약 목록 조회
- 예약 수정 (본인 예약만)
- 예약 취소 (본인 예약만)

**예약 상태**:
- `pending`: 대기중
- `confirmed`: 확정
- `in_progress`: 진행중
- `awaiting_checkout`: 체크아웃 대기
- `finished`: 완료
- `cancelled`: 취소

**API 엔드포인트**:
- `POST /reservations` - 예약 생성
- `GET /reservations` - 예약 목록 조회 (Public)
- `GET /reservations/my` - 내 예약 조회
- `PATCH /reservations/:id` - 예약 수정
- `PATCH /reservations/:id/cancel` - 예약 취소
- `DELETE /reservations/:id` - 예약 삭제

**관련 파일**:
- [backend/src/reservation/reservation.controller.ts](backend/src/reservation/reservation.controller.ts)
- [backend/src/reservation/reservation.service.ts](backend/src/reservation/reservation.service.ts)

---

### 체크인/체크아웃 시스템 ✅

**구현 완료**: 2025-01-10

예약 시작 시 체크인 및 종료 시 체크아웃 기능

**주요 기능**:
- 예약 시작 시간부터 체크인 가능
- 지각 처리: 시작 시간 후 10분 이내 체크인 시
- 체크아웃 사진 업로드 필수
- 조기 반납 기능

**지각 관리**:
- 지각 3회 = 노쇼 1회 자동 전환
- `users.late_count` 관리

**API 엔드포인트**:
- `POST /reservations/:id/check-in` - 체크인
- `POST /reservations/:id/early-return` - 조기 반납

**관련 파일**:
- [backend/src/reservation/reservation.service.ts](backend/src/reservation/reservation.service.ts)

**상세 문서**: 체크아웃 사진 업로드 구현 완료

---

### 노쇼 관리 시스템 ✅

**구현 완료**: 2025-01-08

노쇼 신고 및 자동 패널티 시스템

**주요 기능**:
- 예약 시작 10분 후부터 노쇼 신고 가능 (Public API)
- 노쇼 발생 시 7일간 예약 정지 자동 적용
- 노쇼 3회 시 관리자 면담 필요 (수동 처리)

**노쇼 처리 로직**:
1. 노쇼 신고 (`POST /reservations/:id/no-show`)
2. `users.no_show_count` 증가
3. `users.is_reservation_banned = true`
4. `users.ban_until = NOW() + 7 days`

**API 엔드포인트**:
- `POST /reservations/:id/no-show` - 노쇼 신고

**관련 파일**:
- [backend/src/reservation/reservation.service.ts](backend/src/reservation/reservation.service.ts)

---

### 예약 통계 ✅

**구현 완료**: 2025-01-08

예약 관련 통계 데이터 조회

**주요 기능**:
- 기간별 예약 통계
- 예약 상태별 집계
- 평균 참석자 수
- Excel 내보내기

**API 엔드포인트**:
- `GET /reservations/stats` - 예약 통계 조회
- `GET /reservations/export` - Excel 내보내기

**관련 파일**:
- [backend/src/reservation/reservation.service.ts](backend/src/reservation/reservation.service.ts)

---

## 관리자 기능

### 백업 및 복원 시스템 ✅

**구현 완료**: 2025-01-08

데이터베이스 백업 생성, 다운로드, 복원 기능

**주요 기능**:
- 수동 백업 생성 (`POST /admin/backup/create`)
- 백업 파일 목록 조회
- 백업 파일 다운로드 (SQL 파일)
- 백업 복원
- 백업 파일 삭제

**백업 파일명 형식**: `backup_YYYYMMDD_HHMMSS.sql`

**API 엔드포인트**:
- `POST /admin/backup/create` - 백업 생성
- `GET /admin/backup/list` - 백업 목록
- `GET /admin/backup/download/:id` - 백업 다운로드
- `POST /admin/backup/restore` - 백업 복원
- `DELETE /admin/backup/:id` - 백업 삭제

**관련 파일**:
- [backend/src/admin/admin.service.ts](backend/src/admin/admin.service.ts)

**상세 문서**: 향후 구현 예정

---

### 시스템 설정 관리 ✅

**구현 완료**: 2025-01-08

시스템 전체 설정을 관리하는 기능

**주요 설정**:
- `maintenanceMode`: 유지보수 모드
- `maxReservationDays`: 최대 예약 가능 일수
- `allowConcurrentReservations`: 동시 예약 허용 여부
- `slackWebhookUrl`: Slack 웹훅 URL

**API 엔드포인트**:
- `GET /admin/settings` - 설정 조회
- `PUT /admin/settings` - 설정 수정
- `POST /admin/system/maintenance` - 유지보수 모드 토글

**관련 파일**:
- [backend/src/admin/admin.service.ts](backend/src/admin/admin.service.ts)
- [backend/src/admin/entities/system-settings.entity.ts](backend/src/admin/entities/system-settings.entity.ts)

---

### 활동 로그 시스템 ✅

**구현 완료**: 2025-01-08

시스템 내 모든 중요 활동을 기록하는 로깅 시스템

**로그 타입**:
- `ROOM_CREATED`, `ROOM_UPDATED`, `ROOM_DELETED`
- `USER_REGISTERED`
- `RESERVATION_CREATED`, `RESERVATION_CANCELLED`
- `BACKUP_CREATED`, `BACKUP_RESTORED`
- `SETTINGS_UPDATED`
- `SYSTEM_MAINTENANCE`
- `EXCEL_UPLOAD`

**로그 레벨**:
- `info`: 정보성 로그
- `success`: 성공 로그
- `warning`: 경고 로그
- `error`: 에러 로그

**API 엔드포인트**:
- `GET /admin/activities/recent` - 최근 활동 로그 조회

**관련 파일**:
- [backend/src/admin/entities/activity-log.entity.ts](backend/src/admin/entities/activity-log.entity.ts)

---

### 사용자 관리 ✅

**구현 완료**: 2025-01-08

관리자의 사용자 정보 관리 기능

**주요 기능**:
- 사용자 목록 조회 (역할별 필터링)
- 사용자 정보 수정
- 사용자 역할 변경
- 예약 금지 상태 변경
- 사용자 데이터 Excel 내보내기

**API 엔드포인트**:
- `GET /users` - 사용자 목록
- `PATCH /users/:id` - 사용자 정보 수정
- `PATCH /users/:id/role` - 역할 변경
- `PATCH /users/:id/reservation-ban` - 예약 금지 설정
- `GET /users/export` - Excel 내보내기

**관련 파일**:
- [backend/src/user/user.controller.ts](backend/src/user/user.controller.ts)
- [backend/src/user/user.service.ts](backend/src/user/user.service.ts)

---

## 보안 기능

### Rate Limiting ✅

**구현 완료**: 2025-01-31

API 엔드포인트별 요청 횟수 제한

**기술 스택**: `@nestjs/throttler`

**Rate Limit 설정**:
- `POST /auth/send-verification`: 60초에 3번
- `POST /auth/verify-code`: 60초에 10번
- `POST /auth/register`: 1시간에 3번
- `POST /auth/login`: 60초에 5번

**에러 처리**:
- HTTP 429 (Too Many Requests) 응답
- 커스텀 에러 필터 (`ThrottlerExceptionFilter`)

**관련 파일**:
- [backend/src/main.ts](backend/src/main.ts)
- [backend/src/common/filters/throttler-exception.filter.ts](backend/src/common/filters/throttler-exception.filter.ts)

---

### 입력 검증 (DTO Validation) ✅

**구현 완료**: 2025-01-08

모든 API 요청에 대한 입력 데이터 검증

**기술 스택**:
- `class-validator` - 데코레이터 기반 검증
- `class-transformer` - 타입 변환

**주요 검증 규칙**:
- `@IsString()`, `@IsNumber()`, `@IsBoolean()` - 타입 검증
- `@MinLength()`, `@MaxLength()` - 길이 제한
- `@Matches()` - 정규식 검증 (예: 인트라 ID, 비밀번호)
- `@IsEmail()` - 이메일 형식 검증

**전역 설정** ([backend/src/main.ts:38-43](backend/src/main.ts#L38-L43)):
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
);
```

---

### 비밀번호 암호화 ✅

**구현 완료**: 2025-01-31

bcrypt를 사용한 비밀번호 해싱

**주요 기능**:
- Salt rounds: 10
- 회원가입 시 자동 해싱
- 로그인 시 비교 검증

**관련 파일**:
- [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)
- [backend/scripts/create-admin.ts](backend/scripts/create-admin.ts)

---

### JWT 토큰 블랙리스트 ✅

**구현 완료**: 2025-01-08

로그아웃 시 토큰 무효화 시스템

**주요 기능**:
- 로그아웃 시 토큰을 블랙리스트에 추가
- JWT 검증 시 블랙리스트 확인
- 만료된 토큰 자동 정리 (예정)

**관련 파일**:
- [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts)

---

## 개발자 도구

### Swagger API 문서 ✅

**구현 완료**: 2025-01-31

Swagger UI를 통한 인터랙티브 API 문서

**주요 기능**:
- 모든 엔드포인트 자동 문서화
- Request/Response 예제 제공
- API 테스트 기능 (Try it out)
- JWT 인증 지원 (Bearer Token)

**접속 URL**: http://localhost:3001/api-docs

**데코레이터**:
- `@ApiTags()` - API 그룹핑
- `@ApiOperation()` - 엔드포인트 설명
- `@ApiResponse()` - 응답 예제
- `@ApiProperty()` - DTO 필드 문서화
- `@ApiBearerAuth()` - JWT 인증 표시

**설정 파일**:
- [backend/src/main.ts:46-75](backend/src/main.ts#L46-L75)

---

### 관리자 계정 관리 스크립트 ✅

**구현 완료**: 2025-01-31

CLI로 관리자 계정을 생성 및 관리하는 스크립트

**주요 기능**:
- 단일 관리자 생성 (`npm run create-admin single`)
- 여러 관리자 생성 (`npm run create-admin multiple`)
- 기존 사용자를 관리자로 승급 (`npm run create-admin promote <intraId>`)
- 모든 사용자 목록 조회 (`npm run create-admin list`)

**기본 관리자**:
- 인트라 ID: `admin`
- 비밀번호: `Admin1234`
- 역할: `admin`

**관련 파일**:
- [backend/scripts/create-admin.ts](backend/scripts/create-admin.ts)

---

### 전역 에러 핸들링 ✅

**구현 완료**: 2025-01-08

모든 예외를 일관된 형식으로 처리하는 필터

**주요 기능**:
- HTTP 예외 통합 처리
- Rate Limit 예외 커스텀 처리
- 에러 로깅 (콘솔)
- 클라이언트 친화적 에러 메시지

**에러 응답 형식**:
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

**관련 파일**:
- [backend/src/common/filters/http-exception.filter.ts](backend/src/common/filters/http-exception.filter.ts)
- [backend/src/common/filters/throttler-exception.filter.ts](backend/src/common/filters/throttler-exception.filter.ts)

---

## 향후 계획 (미구현)

### 1. 자동 백업 스케줄러 📅

매일 오전 3시 자동 백업 생성

**예상 기술**: `@nestjs/schedule`, `node-cron`

**상세 문서**: 향후 구현 예정

---

### 2. 달력/타임라인 뷰 📅

프론트엔드에 달력 및 타임라인 예약 현황 뷰

**예상 기술**: FullCalendar.js 또는 React Big Calendar

**상세 문서**: 향후 구현 예정

---

### 3. 체크아웃 사진 검토 기능 📅

관리자가 체크아웃 사진을 검토하고 승인/거부

**상세 문서**: 향후 구현 예정

---

### 4. 영업시간 외 예약 알림 📅

영업시간 외 예약 시 자동 알림 발송

**상세 문서**: 향후 구현 예정

---

### 5. UI 개선 📅

프론트엔드 UI/UX 전반적 개선

**상세 문서**: 향후 구현 예정

---

## 변경 이력

### 2025-01-31 - Slack 인증 시스템 구현

- Slack Bot 기반 인증 코드 전송/검증 시스템 구현
- `SlackVerification` 엔티티 추가
- Rate Limiting 적용
- Swagger API 문서 설정
- 비밀번호 해싱 수정 (관리자 계정 생성 스크립트)

**Breaking Changes**:
- 기존 42 OAuth 인증 제거
- User 스키마 변경: `username`, `email` → `intraId`

**상세 문서**: Slack 인증 시스템으로 전환 완료

---

### 2025-01-10 - 체크아웃 사진 업로드 기능

- 예약 종료 시 사진 업로드 필수
- `checkout_photo_path`, `checkout_photo_url` 필드 추가
- 파일 업로드 크기 제한 (20MB)

---

### 2025-01-08 - 초기 구현

- JWT 인증 시스템
- 역할 기반 접근 제어
- 회의실 CRUD
- 예약 시스템
- 노쇼 관리
- 관리자 백업/복원

---

## 참고 문서

- [API 명세](./API.md)
- [데이터베이스 스키마](./TABLES.md)
- [개발 환경 셋팅](./START_DEV.md)
- [유지보수 계획서](./AS.md)

---

**최종 수정일**: 2025-01-31
**작성자**: GGS (42경산 개발 동아리)
