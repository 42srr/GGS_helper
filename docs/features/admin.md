# 관리자 기능

관리자 전용 기능과 권한을 설명합니다.

## 권한

관리자(`role: 'admin'`)만 접근 가능한 기능입니다.

## 주요 기능

### 1. 예약 관리

- 전체 예약 조회
- 예약 승인/거부
- 체크아웃 사진 검토 및 승인
- 예약 강제 취소

**API:**

```
GET    /admin/reservations
PATCH  /admin/reservations/:id/approve
PATCH  /admin/reservations/:id/reject
POST   /admin/reservations/:id/verify-checkout
DELETE /admin/reservations/:id
```

### 2. 회의실 관리

- 회의실 생성/수정/삭제
- Excel 일괄 업로드
- 사용 가능 여부 설정

**API:**

```
POST   /admin/rooms
PATCH  /admin/rooms/:id
DELETE /admin/rooms/:id
POST   /admin/rooms/import
```

### 3. 사용자 관리

- 전체 사용자 조회
- 권한(role) 변경
- 예약 금지 설정
- 노쇼/지각 기록 조회

**API:**

```
GET    /admin/users
PATCH  /admin/users/:id/role
PATCH  /admin/users/:id/ban
GET    /admin/users/:id/penalties
```

### 4. 통계 및 리포트

- 예약 통계 (기간별, 회의실별)
- 사용률 분석
- Excel 내보내기

**API:**

```
GET /admin/statistics?startDate=2024-01-01&endDate=2024-01-31
GET /admin/statistics/export
```

### 5. 백업/복원

- 데이터베이스 백업 생성
- 백업 목록 조회
- 백업 복원

**API:**

```
POST /admin/backup
GET  /admin/backup/list
POST /admin/backup/restore
```

## 페이지 구조

```
/admin
├── /dashboard        # 대시보드 (통계 요약)
├── /reservations     # 예약 관리
├── /rooms            # 회의실 관리
├── /users            # 사용자 관리
├── /statistics       # 통계 및 리포트
└── /settings         # 시스템 설정
```

## 보안

- JwtAuthGuard + RolesGuard 사용
- 모든 관리자 작업은 activity_log에 기록
- 민감한 작업은 추가 확인 필요

## 다음 단계

- [인증/인가](./authentication.md)
- [보안 기능](./security.md)
