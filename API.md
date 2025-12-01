# GGS Helper API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication

### 인증 방식
JWT (JSON Web Token) 기반 인증 사용

### 인증 헤더
```
Authorization: Bearer <access_token>
```

### 사용자 역할 (Role)
- `student`: 일반 학생 (기본값)
- `staff`: 스태프
- `admin`: 관리자

### 권한 계층 (ROLE_HIERARCHY)
- student: 1
- staff: 2
- admin: 4

숫자가 높을수록 상위 권한

---

## 1. 인증 (Auth)

### 1.1 42 OAuth 로그인
```
GET /auth/42
```
42 OAuth 인증 페이지로 리다이렉트

**Response**: 302 Redirect to 42 OAuth

---

### 1.2 42 OAuth Callback
```
GET /auth/42/callback?code={code}
```
42 OAuth 콜백 처리

**Query Parameters**:
- `code` (string, required): OAuth authorization code

**Response**: 302 Redirect to frontend with tokens
```
{frontend_url}/auth/callback?access_token={token}&refresh_token={token}&user={user_json}
```

---

### 1.3 토큰 갱신
```
POST /auth/refresh
```

**Request Body**:
```json
{
  "userId": 1,
  "refreshToken": "refresh_token_here"
}
```

**Response**:
```json
{
  "access_token": "new_access_token"
}
```

---

### 1.4 로그아웃
```
POST /auth/logout
```

**Auth Required**: Yes

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

---

### 1.5 내 프로필 조회
```
GET /auth/me
```

**Auth Required**: Yes

**Response**:
```json
{
  "userId": 1,
  "intraId": "yutsong",
  "name": "유성태",
  "role": "student",
  ...
}
```

---

## 2. 사용자 (Users)

### 2.1 사용자 목록 조회
```
GET /users
GET /users?role=admin
```

**Auth Required**: Yes
**Permission**: `user:read`

**Query Parameters**:
- `role` (string, optional): 역할별 필터링 (student, staff, admin)

**Response**:
```json
[
  {
    "userId": 1,
    "intraId": "yutsong",
    "name": "유성태",
    "role": "student",
    "isAvailable": true,
    "profileImgUrl": "...",
    "noShowCount": 0,
    "lateCount": 0,
    "isReservationBanned": false,
    "banUntil": null,
    "reservationCount": 5
  }
]
```

---

### 2.2 사용자 정보 수정
```
PATCH /users/:id
```

**Auth Required**: Yes
**Permission**: `user:update`

**Path Parameters**:
- `id` (number): 사용자 ID

**Request Body**:
```json
{
  "name": "새 이름",
  "profileImgUrl": "...",
  "isAvailable": true
}
```

---

### 2.3 사용자 역할 변경
```
PATCH /users/:id/role
```

**Auth Required**: Yes
**Permission**: `user:role:update`

**Request Body**:
```json
{
  "role": "admin"
}
```

---

### 2.4 사용자 통계 조회
```
GET /users/stats
```

**Auth Required**: Yes (본인만)

**Response**:
```json
{
  "userId": 1,
  "name": "유성태",
  "info": {
    "level": 3.14,
    "wallet": 50,
    "evalPoint": 10,
    "studyTime": 120.5,
    "coalition": "Gun",
    "activeProject": "[...]"
  }
}
```

---

### 2.5 예약 가능 상태 조회
```
GET /users/reservation-status
```

**Auth Required**: Yes (본인만)

**Response**:
```json
{
  "canReserve": true,
  "isBanned": false,
  "banUntil": null,
  "noShowCount": 0,
  "lateCount": 0
}
```

---

### 2.6 예약 금지 상태 변경
```
PATCH /users/:id/reservation-ban
```

**Auth Required**: Yes
**Permission**: `user:update`

**Request Body**:
```json
{
  "isReservationBanned": true,
  "banUntil": "2025-12-31T23:59:59Z"
}
```

---

### 2.7 대시보드 데이터 조회
```
GET /users/dashboard
```

**Auth Required**: Yes (본인만)

**Response**:
```json
{
  "user": {
    "id": 1,
    "email": "yutsong@student.42seoul.kr",
    "login": "yutsong",
    "displayName": "유성태",
    "imageUrl": "..."
  },
  "stats": {
    "level": 3.14,
    "wallet": 50,
    "correctionPoint": 10,
    "monthlyHours": 120.5,
    "cursusName": "42cursus",
    "grade": "Cadet",
    "coalitions": [{"name": "Gun"}],
    "activeProjects": [...],
    "dataLastUpdated": "2025-12-01T00:00:00Z"
  }
}
```

---

### 2.8 사용자 통계 새로고침
```
POST /users/stats/refresh
```

**Auth Required**: Yes (본인만)

42 API에서 최신 데이터를 강제로 가져와서 업데이트

---

### 2.9 사용자 데이터 Excel 내보내기
```
GET /users/export
```

**Auth Required**: Yes
**Permission**: `user:export`

**Response**: Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)

---

## 3. 회의실 (Rooms)

### 3.1 회의실 생성
```
POST /rooms
```

**Auth Required**: Yes
**Permission**: `room:create`

**Request Body**:
```json
{
  "name": "회의실 A",
  "location": "1층",
  "capacity": 8,
  "description": "프로젝트 회의용",
  "equipment": "TV, 화이트보드",
  "isActive": true,
  "isConfirm": false
}
```

---

### 3.2 회의실 목록 조회
```
GET /rooms
GET /rooms?search=keyword
```

**Auth Required**: Yes
**Permission**: `room:read`

**Query Parameters**:
- `search` (string, optional): 검색어 (이름, 위치, 설명)

**Response**:
```json
[
  {
    "roomId": 1,
    "name": "회의실 A",
    "location": "1층",
    "capacity": 8,
    "description": "프로젝트 회의용",
    "equipment": "TV, 화이트보드",
    "isAvailable": true,
    "isConfirm": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
]
```

---

### 3.3 회의실 상세 조회
```
GET /rooms/:id
```

**Auth Required**: Yes
**Permission**: `room:read`

---

### 3.4 회의실 정보 수정
```
PATCH /rooms/:id
```

**Auth Required**: Yes
**Permission**: `room:update`

**Request Body**:
```json
{
  "name": "새 회의실 이름",
  "capacity": 10
}
```

---

### 3.5 회의실 삭제
```
DELETE /rooms/:id
```

**Auth Required**: Yes
**Permission**: `room:delete`

회의실을 완전히 삭제하는 것이 아니라 `isAvailable`을 false로 설정

---

### 3.6 Excel 템플릿 다운로드
```
GET /rooms/template
```

**Auth Required**: Yes
**Permission**: `room:read`

**Response**: Excel template file

---

### 3.7 Excel로 회의실 내보내기
```
GET /rooms/export
```

**Auth Required**: Yes
**Permission**: `room:read`

**Response**: Excel file with all rooms

---

### 3.8 Excel로 회의실 일괄 업로드
```
POST /rooms/upload
```

**Auth Required**: Yes
**Permission**: `room:create`

**Request**: multipart/form-data
- `file`: Excel file (.xlsx, .xls, max 20MB)

**Response**:
```json
{
  "message": "File processed successfully",
  "success": 10,
  "errors": [],
  "replaced": 5,
  "total": 10
}
```

**Note**: 기존 회의실을 모두 삭제하고 새로 업로드합니다.

---

## 4. 예약 (Reservations)

### 4.1 예약 생성
```
POST /reservations
```

**Auth Required**: Yes

**Request Body**:
```json
{
  "roomId": 1,
  "title": "프로젝트 회의",
  "description": "Circle 3 프로젝트 논의",
  "startTime": "2025-12-01T14:00:00Z",
  "endTime": "2025-12-01T16:00:00Z",
  "attendees": 4,
  "teamName": "Team A"
}
```

**Response**:
```json
{
  "reservationId": 1,
  "roomId": 1,
  "userId": 1,
  "title": "프로젝트 회의",
  "status": "confirmed",
  "isNoShow": false,
  "isLate": false,
  ...
}
```

---

### 4.2 예약 목록 조회
```
GET /reservations
GET /reservations?room=1&startDate=2025-12-01&endDate=2025-12-31
```

**Auth Required**: No (Public)

**Query Parameters**:
- `room` (number, optional): 회의실 ID로 필터링
- `startDate` (string, optional): 시작 날짜
- `endDate` (string, optional): 종료 날짜

---

### 4.3 내 예약 목록 조회
```
GET /reservations/my
```

**Auth Required**: Yes

---

### 4.4 예약 상세 조회
```
GET /reservations/:id
```

**Auth Required**: Yes

---

### 4.5 예약 수정
```
PATCH /reservations/:id
```

**Auth Required**: Yes (본인 예약만)

**Request Body**:
```json
{
  "title": "수정된 제목",
  "startTime": "2025-12-01T15:00:00Z",
  "endTime": "2025-12-01T17:00:00Z"
}
```

---

### 4.6 예약 취소
```
PATCH /reservations/:id/cancel
```

**Auth Required**: Yes (본인 예약만)

**Response**:
```json
{
  "message": "Reservation cancelled successfully",
  "reservation": {...}
}
```

---

### 4.7 예약 삭제
```
DELETE /reservations/:id
```

**Auth Required**: Yes (본인 예약만)

---

### 4.8 노쇼 신고
```
POST /reservations/:id/no-show
```

**Auth Required**: No (Public)

예약 시작 시간 10분 후부터 노쇼 신고 가능

**Response**:
```json
{
  "message": "No-show reported successfully",
  "noShowCount": 1,
  "userBanned": false
}
```

**노쇼 처리 로직**:
- 노쇼 발생 시: 7일간 예약 정지
- 노쇼 3회: 관리자 면담 필요

---

### 4.9 체크인
```
POST /reservations/:id/check-in
```

**Auth Required**: Yes

예약 시작 시간부터 체크인 가능

**지각 처리 로직**:
- 예약 시작 시간 후 10분 이내 체크인: 지각 처리
- 지각 3회 = 노쇼 1회 자동 전환

---

### 4.10 조기 반납
```
POST /reservations/:id/early-return
```

**Auth Required**: Yes (본인 예약만)

---

### 4.11 예약 통계
```
GET /reservations/stats?startDate=2025-01-01&endDate=2025-12-31
```

**Auth Required**: Yes

**Response**:
```json
{
  "totalReservations": 100,
  "confirmedReservations": 80,
  "cancelledReservations": 15,
  "noShowReservations": 5,
  "averageAttendees": 3.5
}
```

---

### 4.12 예약 Excel 내보내기
```
GET /reservations/export
```

**Auth Required**: Yes

---

### 4.13 (관리자) 모든 예약 조회
```
GET /reservations/admin/all
```

**Auth Required**: Yes
**Role**: admin

---

### 4.14 (관리자) 예약 강제 취소
```
PATCH /reservations/admin/:id/cancel
```

**Auth Required**: Yes
**Role**: admin

---

### 4.15 (관리자) 예약 승인
```
PATCH /reservations/admin/:id/approve
```

**Auth Required**: Yes
**Role**: admin

---

### 4.16 (관리자) 예약 거부
```
PATCH /reservations/admin/:id/reject
```

**Auth Required**: Yes
**Role**: admin

---

### 4.17 (관리자) 예약 상태 변경
```
PATCH /reservations/admin/:id/status
```

**Auth Required**: Yes
**Role**: admin

**Request Body**:
```json
{
  "status": "confirmed"
}
```

**예약 상태 값**:
- `confirmed`: 확정
- `pending`: 대기
- `cancelled`: 취소
- `completed`: 완료

---

## 5. 동아리 (Clubs)

### 5.1 동아리 생성
```
POST /clubs
```

**Auth Required**: Yes
**Permission**: `club:create`

**Request Body**:
```json
{
  "name": "알고리즘 동아리",
  "leaderId": 1,
  "description": "알고리즘 스터디 동아리"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "알고리즘 동아리",
  "leaderId": 1,
  "description": "알고리즘 스터디 동아리",
  "countMember": 1,
  "createdAt": "2025-12-01T00:00:00Z",
  "updatedAt": "2025-12-01T00:00:00Z"
}
```

**Note**: 리더는 자동으로 멤버로 추가됩니다.

---

### 5.2 동아리 목록 조회
```
GET /clubs
```

**Auth Required**: Yes
**Permission**: `club:read`

**Response**:
```json
[
  {
    "id": 1,
    "name": "알고리즘 동아리",
    "leaderId": 1,
    "description": "알고리즘 스터디 동아리",
    "countMember": 5,
    "leader": {
      "userId": 1,
      "name": "유성태",
      "intraId": "yutsong"
    },
    "createdAt": "2025-12-01T00:00:00Z"
  }
]
```

---

### 5.3 동아리 상세 조회
```
GET /clubs/:id
```

**Auth Required**: Yes
**Permission**: `club:read`

**Response**:
```json
{
  "id": 1,
  "name": "알고리즘 동아리",
  "leaderId": 1,
  "description": "...",
  "countMember": 5,
  "leader": {...},
  "members": [
    {
      "id": 1,
      "clubId": 1,
      "userId": 1,
      "role": "leader",
      "status": "active",
      "user": {
        "userId": 1,
        "name": "유성태",
        "intraId": "yutsong"
      }
    }
  ]
}
```

---

### 5.4 동아리 정보 수정
```
PATCH /clubs/:id
```

**Auth Required**: Yes
**Permission**: `club:update`

**Request Body**:
```json
{
  "name": "새 동아리 이름",
  "leaderId": 2,
  "description": "새 설명"
}
```

**Note**: 리더 변경 시 기존 리더는 일반 멤버로, 새 리더는 리더 역할로 자동 변경됩니다.

---

### 5.5 동아리 삭제
```
DELETE /clubs/:id
```

**Auth Required**: Yes
**Permission**: `club:delete`

**Note**: 멤버도 함께 삭제됩니다.

---

### 5.6 동아리 가입
```
POST /clubs/join
```

**Auth Required**: Yes
**Permission**: `club:join`

**Request Body**:
```json
{
  "clubId": 1,
  "userId": 2
}
```

**Response**:
```json
{
  "id": 2,
  "clubId": 1,
  "userId": 2,
  "role": "member",
  "status": "active",
  "createdAt": "2025-12-01T00:00:00Z"
}
```

**Error**: 이미 가입된 회원인 경우 409 Conflict

---

### 5.7 동아리 멤버 목록 조회
```
GET /clubs/:id/members
```

**Auth Required**: Yes
**Permission**: `club:read`

**Response**:
```json
[
  {
    "id": 1,
    "clubId": 1,
    "userId": 1,
    "role": "leader",
    "status": "active",
    "user": {
      "userId": 1,
      "name": "유성태",
      "intraId": "yutsong",
      "profileImgUrl": "..."
    },
    "createdAt": "2025-12-01T00:00:00Z"
  }
]
```

---

### 5.8 동아리 멤버 상태 변경
```
PATCH /clubs/:clubId/members/:userId/status
```

**Auth Required**: Yes
**Permission**: `club:update`

**Path Parameters**:
- `clubId` (number): 동아리 ID
- `userId` (number): 사용자 ID

**Request Body**:
```json
{
  "status": "freeze"
}
```

**멤버 상태 값**:
- `active`: 활동중
- `freeze`: 휴면
- `work`: 활동중 (작업)
- `inactive`: 비활성

---

### 5.9 동아리 멤버 역할 변경
```
PATCH /clubs/:clubId/members/:userId/role
```

**Auth Required**: Yes
**Permission**: `club:update`

**Request Body**:
```json
{
  "role": "staff"
}
```

**멤버 역할 값**:
- `member`: 일반 멤버
- `leader`: 동아리장
- `staff`: 운영진

**Note**: 리더로 변경 시 기존 리더는 자동으로 일반 멤버로 강등되고, 동아리의 leaderId도 업데이트됩니다.

---

## 6. 관리자 (Admin)

### 6.1 백업 생성
```
POST /admin/backup/create
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Response**:
```json
{
  "message": "Backup created successfully",
  "backupId": "backup_20251201_123456",
  "timestamp": "2025-12-01T12:34:56Z"
}
```

---

### 6.2 백업 목록 조회
```
GET /admin/backup/list
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 6.3 백업 다운로드
```
GET /admin/backup/download/:id
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Response**: SQL file (application/sql)

---

### 6.4 백업 삭제
```
DELETE /admin/backup/:id
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 6.5 백업 복원
```
POST /admin/backup/restore
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Request Body**:
```json
{
  "backupId": "backup_20251201_123456"
}
```

---

### 6.6 시스템 통계
```
GET /admin/system/stats
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Response**:
```json
{
  "totalUsers": 100,
  "totalRooms": 10,
  "totalReservations": 500,
  "activeReservations": 5,
  "systemUptime": 86400,
  "databaseSize": "50MB"
}
```

---

### 6.7 시스템 설정 조회
```
GET /admin/settings
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 6.8 시스템 설정 수정
```
PUT /admin/settings
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Request Body**:
```json
{
  "maintenanceMode": false,
  "maxReservationDays": 30,
  "allowConcurrentReservations": true
}
```

---

### 6.9 유지보수 모드 토글
```
POST /admin/system/maintenance
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Request Body**:
```json
{
  "enabled": true
}
```

---

### 6.10 데이터베이스 초기화
```
POST /admin/system/database-reset
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Warning**: 매우 위험한 작업. 운영 환경에서는 추가 인증 필요

---

### 6.11 로그 삭제
```
POST /admin/system/clear-logs
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 6.12 API 키 테스트
```
POST /admin/system/test-api-keys
```

**Auth Required**: Yes
**Permission**: `admin:*`

42 API 키가 정상적으로 작동하는지 테스트

---

### 6.13 통계 조회
```
GET /admin/statistics?period=30d
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Query Parameters**:
- `period` (string, optional): 기간 (7d, 30d, 90d, 1y)

---

### 6.14 통계 Excel 내보내기
```
GET /admin/statistics/export
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Response**: Excel file

---

### 6.15 최근 활동 로그 조회
```
GET /admin/activities/recent?limit=10
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Query Parameters**:
- `limit` (number, optional): 조회 개수 (기본값: 10)

**Response**:
```json
[
  {
    "id": 1,
    "type": "room_created",
    "title": "새 회의실 추가됨",
    "description": "관리자에 의해 '회의실 A' 추가",
    "userId": 1,
    "level": "success",
    "createdAt": "2025-12-01T00:00:00Z"
  }
]
```

**활동 로그 타입**:
- `room_created`, `room_updated`, `room_deleted`
- `user_registered`
- `reservation_created`, `reservation_cancelled`
- `backup_created`, `backup_restored`
- `settings_updated`
- `system_maintenance`
- `excel_upload`
- `club_approved`, `club_rejected`, `club_created`, `club_updated`, `club_deleted`

---

### 6.16 42 API 키 정보 조회
```
GET /admin/api-keys/42/info
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Response**:
```json
{
  "clientId": "u-s4...",
  "currentSecretPrefix": "s-s4t2...",
  "newSecretActive": false,
  "newSecretPrefix": null,
  "dualKeyMode": false
}
```

---

### 6.17 42 API 새 키 추가
```
POST /admin/api-keys/42/set-new
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Request Body**:
```json
{
  "secret": "s-s4t2new..."
}
```

Dual key 모드 활성화 (현재 키와 새 키 모두 유효)

---

### 6.18 42 API 새 키를 Primary로 승격
```
POST /admin/api-keys/42/promote
```

**Auth Required**: Yes
**Permission**: `admin:*`

새 키를 primary로 승격하고 이전 키 제거

**Note**: 개발 환경에서는 자동으로 서버 재시작

---

### 6.19 42 API 새 키 제거
```
POST /admin/api-keys/42/remove-new
```

**Auth Required**: Yes
**Permission**: `admin:*`

새 키를 제거하고 현재 키만 사용

---

## 7. 42 API 관리 (API42 Admin)

### 7.1 42 API 설정 정보 조회
```
GET /api42-admin/config-info
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 7.2 새 Secret 키 추가
```
POST /api42-admin/set-new-secret
```

**Auth Required**: Yes
**Permission**: `admin:*`

**Request Body**:
```json
{
  "secret": "s-s4t2new..."
}
```

---

### 7.3 새 Secret을 Primary로 승격
```
POST /api42-admin/promote-secret
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 7.4 새 Secret 제거
```
POST /api42-admin/remove-new-secret
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 7.5 설정 파일 다시 로드
```
POST /api42-admin/reload-config
```

**Auth Required**: Yes
**Permission**: `admin:*`

---

### 7.6 사용 가이드 조회
```
GET /api42-admin/help
```

**Auth Required**: Yes
**Permission**: `admin:*`

Dual Key 방식의 42 API 키 관리 가이드 반환

---

## Error Responses

### 일반적인 에러 형식
```json
{
  "statusCode": 400,
  "message": "Error message here",
  "error": "Bad Request"
}
```

### HTTP Status Codes
- `200 OK`: 성공
- `201 Created`: 생성 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 충돌 (예: 중복 가입)
- `500 Internal Server Error`: 서버 오류

---

## 권한 시스템

### Permission 문자열
- `user:read`, `user:update`, `user:role:update`, `user:export`
- `room:create`, `room:read`, `room:update`, `room:delete`
- `reservation:create`, `reservation:read`, `reservation:update`, `reservation:delete`
- `club:create`, `club:read`, `club:update`, `club:delete`, `club:join`
- `admin:*`: 모든 관리자 권한

### 데코레이터
- `@RequirePermissions('permission:string')`: 특정 권한 필요
- `@Roles(Role.ADMIN)`: 특정 역할 필요
- `@OwnerOnly()`: 본인 리소스만 접근 가능
- `@Public()`: 인증 불필요

---

## Rate Limiting

현재 API에는 rate limiting이 설정되어 있지 않습니다. 운영 환경에서는 추가 설정이 필요합니다.

---

## Pagination

현재 대부분의 목록 조회 API는 pagination을 지원하지 않습니다. 향후 추가 예정입니다.

---

## Webhooks

현재 webhook 기능은 지원하지 않습니다.

---

## Version

API Version: 1.0.0
Last Updated: 2025-12-01
