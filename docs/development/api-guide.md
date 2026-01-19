# API 가이드

GGS Helper의 REST API 엔드포인트와 사용 방법을 설명합니다.

## 목차

- [개요](#개요)
- [인증](#인증)
- [응답 형식](#응답-형식)
- [에러 처리](#에러-처리)
- [Rate Limiting](#rate-limiting)
- [API 엔드포인트](#api-엔드포인트)

## 개요

### Base URL

```
개발 환경: http://localhost:6112
프로덕션: https://api.yourdomain.com
```

### Content Type

모든 요청과 응답은 JSON 형식:

```
Content-Type: application/json
```

파일 업로드 제외:

```
Content-Type: multipart/form-data
```

## 인증

### JWT Bearer Token

대부분의 API는 JWT 토큰 기반 인증 필요:

```http
Authorization: Bearer <access_token>
```

### 토큰 획득

로그인 성공 시 `accessToken` 반환:

```bash
curl -X POST http://localhost:6112/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","password":"Pass1234!"}'
```

응답:

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "user123",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "student"
  }
}
```

### Public 엔드포인트

다음 엔드포인트는 인증 불필요:

- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /reservations` - 전체 예약 조회 (공개)
- `POST /reservations/:id/no-show` - 노쇼 신고

## 응답 형식

### 성공 응답

```json
{
  "data": { ... },
  "message": "Success message"
}
```

또는 데이터만 반환:

```json
{
  "userId": 1,
  "username": "user123"
}
```

### 배열 응답

```json
[
  { "reservationId": 1, ... },
  { "reservationId": 2, ... }
]
```

## 에러 처리

### 에러 응답 형식

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### HTTP 상태 코드

| 코드 | 의미 | 설명 |
|-----|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 (검증 실패) |
| 401 | Unauthorized | 인증 실패 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 409 | Conflict | 리소스 충돌 |
| 429 | Too Many Requests | Rate limit 초과 |
| 500 | Internal Server Error | 서버 오류 |

### 에러 예시

**검증 실패 (400):**

```json
{
  "statusCode": 400,
  "message": [
    "password must match /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/ regular expression",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

**인증 실패 (401):**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**권한 없음 (403):**

```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

## Rate Limiting

### 전역 제한

기본 설정: **60초에 100 요청**

### 엔드포인트별 제한

| 엔드포인트 | 제한 | TTL | 용도 |
|----------|-----|-----|------|
| `POST /auth/register` | 3회 | 3600초 (1시간) | 스팸 계정 방지 |
| `POST /auth/login` | 5회 | 60초 | Brute force 방지 |
| `POST /reservations` | 20회 | 60초 | 스팸 예약 방지 |
| `POST /reservations/check-conflict` | 60회 | 60초 | 실시간 충돌 체크 |

### Rate Limit 초과 응답

```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

---

## API 엔드포인트

## 🔐 인증 (Auth)

### 회원가입

회원가입을 합니다.

```http
POST /auth/register
Content-Type: application/json
Rate Limit: 3 requests per 1 hour
```

**Request Body:**

```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "Pass1234!",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

**Validation Rules:**

- `username`: 영문, 숫자, 하이픈(-), 언더스코어(_)만 허용
- `email`: 유효한 이메일 형식
- `password`:
  - 8자 이상
  - 대문자, 소문자, 숫자 포함 필수
- `name`: 필수
- `phone`: 선택

**Response (201):**

```json
{
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "name": "홍길동",
  "role": "student"
}
```

**Errors:**

- `400`: 검증 실패 또는 중복된 username/email
- `429`: Rate limit 초과

### 로그인

로그인하여 JWT 토큰을 받습니다.

```http
POST /auth/login
Content-Type: application/json
Rate Limit: 5 requests per 60 seconds
```

**Request Body:**

```json
{
  "username": "user123",
  "password": "Pass1234!"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "user123",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "student",
    "isReservationBanned": false
  }
}
```

**Errors:**

- `401`: 잘못된 username 또는 password
- `429`: Rate limit 초과

### 로그아웃

로그아웃하고 토큰을 블랙리스트에 추가합니다.

```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

### 내 정보 조회

현재 로그인한 사용자 정보를 조회합니다.

```http
GET /auth/me
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "name": "홍길동",
  "role": "student"
}
```

---

## 📅 예약 (Reservations)

### 예약 생성

새 예약을 생성합니다.

```http
POST /reservations
Authorization: Bearer <token>
Content-Type: application/json
Rate Limit: 20 requests per 60 seconds
```

**Request Body:**

```json
{
  "roomId": 1,
  "title": "팀 프로젝트 회의",
  "description": "React 프로젝트 논의",
  "startTime": "2024-01-20T14:00:00Z",
  "endTime": "2024-01-20T16:00:00Z",
  "attendees": 4,
  "teamName": "개발팀"
}
```

**Response (201):**

```json
{
  "reservationId": 1,
  "roomId": 1,
  "userId": 1,
  "title": "팀 프로젝트 회의",
  "description": "React 프로젝트 논의",
  "startTime": "2024-01-20T14:00:00.000Z",
  "endTime": "2024-01-20T16:00:00.000Z",
  "status": "confirmed",
  "createdAt": "2024-01-19T10:00:00.000Z"
}
```

**Errors:**

- `400`: 검증 실패 (시간 범위, 필수 필드)
- `409`: 예약 충돌 (해당 시간대에 다른 예약 존재)
- `403`: 예약 금지 사용자

### 예약 충돌 체크

예약 생성 전 시간대 충돌을 확인합니다.

```http
POST /reservations/check-conflict
Authorization: Bearer <token>
Content-Type: application/json
Rate Limit: 60 requests per 60 seconds
```

**Request Body:**

```json
{
  "roomId": 1,
  "startDatetime": "2024-01-20T14:00:00Z",
  "endDatetime": "2024-01-20T16:00:00Z"
}
```

**Response (200):**

```json
{
  "hasConflict": false,
  "message": "예약 가능한 시간입니다"
}
```

또는:

```json
{
  "hasConflict": true,
  "message": "해당 시간대에 이미 다른 예약이 있습니다"
}
```

### 전체 예약 조회

모든 예약을 조회합니다 (Public API).

```http
GET /reservations
[Authorization: Bearer <token>] (선택)
```

**Query Parameters:**

- `room` (optional): 특정 회의실 필터링
- `startDate` (optional): 시작 날짜 필터 (YYYY-MM-DD)
- `endDate` (optional): 종료 날짜 필터 (YYYY-MM-DD)

**Example:**

```bash
GET /reservations?room=1&startDate=2024-01-20&endDate=2024-01-27
```

**Response (200):**

```json
[
  {
    "reservationId": 1,
    "roomId": 1,
    "userId": 1,
    "title": "팀 회의",
    "startTime": "2024-01-20T14:00:00.000Z",
    "endTime": "2024-01-20T16:00:00.000Z",
    "status": "confirmed",
    "room": {
      "roomId": 1,
      "name": "회의실 A",
      "location": "3층"
    },
    "user": {
      "userId": 1,
      "name": "홍길동"
    }
  }
]
```

### 내 예약 조회

현재 사용자의 예약 목록을 조회합니다.

```http
GET /reservations/my
Authorization: Bearer <token>
```

**Response (200):**

```json
[
  {
    "reservationId": 1,
    "title": "팀 회의",
    "startTime": "2024-01-20T14:00:00.000Z",
    "endTime": "2024-01-20T16:00:00.000Z",
    "status": "confirmed",
    "room": {
      "name": "회의실 A",
      "location": "3층"
    }
  }
]
```

### 예약 상세 조회

특정 예약의 상세 정보를 조회합니다.

```http
GET /reservations/:id
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "reservationId": 1,
  "roomId": 1,
  "userId": 1,
  "title": "팀 회의",
  "description": "React 프로젝트 논의",
  "startTime": "2024-01-20T14:00:00.000Z",
  "endTime": "2024-01-20T16:00:00.000Z",
  "attendees": 4,
  "teamName": "개발팀",
  "status": "confirmed",
  "checkoutPhotoUrl": null,
  "createdAt": "2024-01-19T10:00:00.000Z",
  "room": {
    "roomId": 1,
    "name": "회의실 A",
    "location": "3층",
    "capacity": 10
  },
  "user": {
    "userId": 1,
    "name": "홍길동",
    "email": "user@example.com"
  }
}
```

**Errors:**

- `404`: 예약을 찾을 수 없음

### 예약 수정

예약 정보를 수정합니다 (본인만 가능).

```http
PATCH /reservations/:id
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body (모두 선택):**

```json
{
  "title": "수정된 제목",
  "description": "수정된 설명",
  "attendees": 6
}
```

**Response (200):**

```json
{
  "reservationId": 1,
  "title": "수정된 제목",
  "description": "수정된 설명",
  "attendees": 6,
  "updatedAt": "2024-01-19T11:00:00.000Z"
}
```

**Errors:**

- `403`: 권한 없음 (다른 사용자의 예약)
- `404`: 예약을 찾을 수 없음

### 예약 취소

예약을 취소합니다 (status → 'cancelled').

```http
PATCH /reservations/:id/cancel
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "reservationId": 1,
  "status": "cancelled",
  "updatedAt": "2024-01-19T11:00:00.000Z"
}
```

**Errors:**

- `403`: 권한 없음
- `400`: 이미 취소된 예약

### 체크인

예약 시작 시간에 체크인합니다.

```http
POST /reservations/:id/check-in
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "reservationId": 1,
  "status": "in_progress",
  "checkInAt": "2024-01-20T14:05:00.000Z",
  "isLate": true
}
```

- `isLate`: 시작 시간 15분 후 체크인 시 `true`

### 체크아웃 (사진 업로드)

퇴실 시 정리 사진을 업로드합니다.

```http
POST /reservations/:id/checkout
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

```
photo: <File> (JPG, PNG, max 20MB)
notes: "정리 완료" (optional)
```

**Example (curl):**

```bash
curl -X POST http://localhost:6112/reservations/1/checkout \
  -H "Authorization: Bearer <token>" \
  -F "photo=@cleanup.jpg" \
  -F "notes=정리 완료"
```

**Response (200):**

```json
{
  "reservationId": 1,
  "status": "awaiting_checkout",
  "checkoutPhotoPath": "uploads/checkouts/1705756800000-cleanup.jpg",
  "checkoutPhotoUrl": "http://localhost:6112/uploads/checkouts/1705756800000-cleanup.jpg",
  "checkoutNotes": "정리 완료"
}
```

**Errors:**

- `400`: 파일 없음 또는 잘못된 파일 형식
- `403`: 권한 없음

### 노쇼 신고

예약자가 나타나지 않았을 때 신고합니다 (Public API).

```http
POST /reservations/:id/no-show
```

**Response (200):**

```json
{
  "message": "No-show reported successfully"
}
```

신고 횟수가 3회 이상이면 자동으로 노쇼 처리되고 사용자에게 패널티 부여.

---

## 🏢 회의실 (Rooms)

### 회의실 목록 조회

모든 회의실을 조회합니다 (Public API).

```http
GET /rooms
```

**Response (200):**

```json
[
  {
    "roomId": 1,
    "name": "회의실 A",
    "location": "3층",
    "capacity": 10,
    "equipment": "빔 프로젝터, 화이트보드",
    "description": "대형 회의실",
    "isAvailable": true
  }
]
```

### 회의실 상세 조회

특정 회의실의 상세 정보를 조회합니다.

```http
GET /rooms/:id
```

**Response (200):**

```json
{
  "roomId": 1,
  "name": "회의실 A",
  "location": "3층",
  "capacity": 10,
  "equipment": "빔 프로젝터, 화이트보드",
  "description": "대형 회의실",
  "isAvailable": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 👤 사용자 (Users)

### 사용자 목록 조회 (관리자 전용)

모든 사용자를 조회합니다.

```http
GET /users
Authorization: Bearer <token>
Requires: admin role
```

**Response (200):**

```json
[
  {
    "userId": 1,
    "username": "user123",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "student",
    "isAvailable": true,
    "noShowCount": 0,
    "isReservationBanned": false
  }
]
```

---

## 🔧 관리자 (Admin)

### 예약 관리

#### 모든 예약 조회

```http
GET /admin/reservations
Authorization: Bearer <token>
Requires: admin role
```

#### 예약 승인

```http
PATCH /admin/reservations/:id/approve
Authorization: Bearer <token>
Requires: admin role
```

#### 예약 거부

```http
PATCH /admin/reservations/:id/reject
Authorization: Bearer <token>
Requires: admin role
```

#### 체크아웃 승인

```http
POST /admin/reservations/:id/verify-checkout
Authorization: Bearer <token>
Requires: admin role
Content-Type: application/json
```

**Request Body:**

```json
{
  "approved": true,
  "notes": "정리 상태 양호"
}
```

### 회의실 관리

#### 회의실 생성

```http
POST /admin/rooms
Authorization: Bearer <token>
Requires: admin role
Content-Type: application/json
```

**Request Body:**

```json
{
  "name": "회의실 B",
  "location": "4층",
  "capacity": 6,
  "equipment": "TV, 화이트보드",
  "description": "소형 회의실"
}
```

#### 회의실 수정

```http
PATCH /admin/rooms/:id
Authorization: Bearer <token>
Requires: admin role
```

#### 회의실 삭제

```http
DELETE /admin/rooms/:id
Authorization: Bearer <token>
Requires: admin role
```

### 사용자 관리

#### 사용자 권한 수정

```http
PATCH /admin/users/:id/role
Authorization: Bearer <token>
Requires: admin role
Content-Type: application/json
```

**Request Body:**

```json
{
  "role": "staff"
}
```

#### 사용자 예약 금지

```http
PATCH /admin/users/:id/ban
Authorization: Bearer <token>
Requires: admin role
Content-Type: application/json
```

**Request Body:**

```json
{
  "banUntil": "2024-01-31T23:59:59Z",
  "reason": "노쇼 3회"
}
```

### 통계

#### 예약 통계 조회

```http
GET /admin/statistics
Authorization: Bearer <token>
Requires: admin role
Query: ?startDate=2024-01-01&endDate=2024-01-31
```

**Response (200):**

```json
{
  "totalReservations": 150,
  "confirmedReservations": 120,
  "cancelledReservations": 20,
  "noShowReservations": 10,
  "mostUsedRoom": {
    "roomId": 1,
    "name": "회의실 A",
    "count": 50
  }
}
```

#### 통계 Excel 내보내기

```http
GET /admin/statistics/export
Authorization: Bearer <token>
Requires: admin role
```

Excel 파일 다운로드.

---

## 예제 코드

### JavaScript (Fetch API)

```javascript
// 로그인
const response = await fetch('http://localhost:6112/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'user123',
    password: 'Pass1234!'
  })
});
const { accessToken } = await response.json();

// 인증이 필요한 요청
const reservations = await fetch('http://localhost:6112/reservations/my', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
const myReservations = await reservations.json();
```

### cURL

```bash
# 로그인
TOKEN=$(curl -X POST http://localhost:6112/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user123","password":"Pass1234!"}' \
  | jq -r '.accessToken')

# 내 예약 조회
curl http://localhost:6112/reservations/my \
  -H "Authorization: Bearer $TOKEN"

# 예약 생성
curl -X POST http://localhost:6112/reservations \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": 1,
    "title": "팀 회의",
    "startTime": "2024-01-20T14:00:00Z",
    "endTime": "2024-01-20T16:00:00Z",
    "attendees": 4
  }'
```

## 다음 단계

- [데이터베이스 스키마](./database.md) - 테이블 구조
- [인증/인가 시스템](../features/authentication.md) - 인증 상세
- [보안 기능](../features/security.md) - 보안 정책
