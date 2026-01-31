# 데이터베이스 스키마

> GGS Helper 시스템의 데이터베이스 테이블 구조 문서

## 개요

이 문서는 GGS Helper 프로젝트의 PostgreSQL 데이터베이스 스키마를 정의합니다.

**DBMS**: PostgreSQL 16
**ORM**: TypeORM
**마이그레이션 방식**: `synchronize: true` (개발 환경)

---

## 1. users

사용자 정보를 관리하는 테이블

| Column                | Type      | Nullable | Default           | Description                         |
| --------------------- | --------- | -------- | ----------------- | ----------------------------------- |
| user_id               | integer   | NO       | AUTO_INCREMENT    | 사용자 고유 ID (Primary Key)        |
| user_intra_id         | varchar(50) | NO     | -                 | 인트라 ID (Unique)                  |
| user_password         | varchar(255) | NO    | -                 | 비밀번호 (bcrypt 해시)              |
| user_isavailable      | boolean   | NO       | true              | 사용자 활성화 상태                  |
| user_role             | enum      | NO       | 'student'         | 사용자 역할 (student, staff, admin) |
| user_createdat        | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                           |
| user_updatedat        | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                           |
| user_lastloginat      | timestamp | YES      | -                 | 마지막 로그인 일시                  |
| no_show_count         | integer   | NO       | 0                 | 노쇼 횟수                           |
| last_no_show_at       | timestamp | YES      | -                 | 마지막 노쇼 발생 일시               |
| late_count            | integer   | NO       | 0                 | 지각 횟수                           |
| is_reservation_banned | boolean   | NO       | false             | 예약 정지 여부                      |
| ban_until             | timestamp | YES      | -                 | 예약 정지 해제 일시                 |

**인덱스**:
- PRIMARY KEY: `user_id`
- UNIQUE: `user_intra_id`

**관계**:
- OneToMany: `reservations` (Reservation)

**비고**:
- `user_password`는 bcrypt로 해싱되어 저장 (salt rounds: 10)
- 기본 역할은 `student`
- 노쇼 발생 시 7일간 예약 정지 (`is_reservation_banned = true`, `ban_until` 설정)

---

## 2. slack_verifications

Slack 인증 코드를 관리하는 테이블 (회원가입 시 사용)

| Column              | Type        | Nullable | Default           | Description                |
| ------------------- | ----------- | -------- | ----------------- | -------------------------- |
| id                  | integer     | NO       | AUTO_INCREMENT    | 고유 ID (Primary Key)      |
| intra_id            | varchar(50) | NO       | -                 | 인트라 ID                  |
| verification_code   | varchar(6)  | NO       | -                 | 6자리 인증 코드            |
| slack_user_id       | varchar     | YES      | -                 | Slack 사용자 ID            |
| is_verified         | boolean     | NO       | false             | 인증 완료 여부             |
| created_at          | timestamp   | NO       | CURRENT_TIMESTAMP | 생성 일시                  |
| expires_at          | timestamp   | NO       | -                 | 만료 일시 (생성 후 5분)    |

**인덱스**:
- PRIMARY KEY: `id`

**비고**:
- 인증 코드는 6자리 숫자로 생성
- 유효 기간은 5분
- 회원가입 완료 후 `is_verified = true`로 업데이트

---

## 3. room

회의실/공간 정보를 관리하는 테이블

| Column           | Type      | Nullable | Default           | Description              |
| ---------------- | --------- | -------- | ----------------- | ------------------------ |
| room_id          | integer   | NO       | AUTO_INCREMENT    | 방 고유 ID (Primary Key) |
| room_name        | varchar   | NO       | -                 | 방 이름                  |
| room_description | text      | YES      | -                 | 방 설명                  |
| room_location    | varchar   | YES      | -                 | 방 위치                  |
| room_capacity    | integer   | YES      | -                 | 수용 인원                |
| room_equipment   | text      | YES      | -                 | 장비 정보                |
| room_isavailable | boolean   | NO       | true              | 사용 가능 여부           |
| room_is_confirm  | boolean   | NO       | true              | 관리자 승인 필요 여부    |
| room_createdat   | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                |
| room_updatedat   | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                |

**인덱스**:
- PRIMARY KEY: `room_id`

**관계**:
- OneToMany: `reservations` (Reservation)

**비고**:
- `room_isavailable = false`인 회의실은 예약 불가
- `room_is_confirm = true`인 회의실은 관리자 승인 필요

---

## 4. reservation

예약 정보를 관리하는 테이블

| Column                  | Type      | Nullable | Default           | Description                |
| ----------------------- | --------- | -------- | ----------------- | -------------------------- |
| reservation_id          | integer   | NO       | AUTO_INCREMENT    | 예약 고유 ID (Primary Key) |
| room_id                 | integer   | NO       | -                 | 방 ID (Foreign Key)        |
| user_id                 | integer   | NO       | -                 | 사용자 ID (Foreign Key)    |
| reservation_title       | varchar   | NO       | -                 | 예약 제목                  |
| reservation_description | text      | YES      | -                 | 예약 설명                  |
| reservation_starttime   | timestamp | NO       | -                 | 예약 시작 시간             |
| reservation_endtime     | timestamp | NO       | -                 | 예약 종료 시간             |
| reservation_attendees   | integer   | NO       | 0                 | 참석자 수                  |
| team_name               | varchar   | YES      | -                 | 팀 이름                    |
| reservation_status      | varchar   | NO       | 'confirmed'       | 예약 상태                  |
| is_no_show              | boolean   | NO       | false             | 노쇼 여부                  |
| no_show_reported_at     | timestamp | YES      | -                 | 노쇼 신고 일시             |
| no_show_report_count    | integer   | NO       | 0                 | 노쇼 신고 횟수             |
| check_in_at             | timestamp | YES      | -                 | 체크인 일시                |
| is_late                 | boolean   | NO       | false             | 지각 여부                  |
| checkout_photo_path     | varchar(500) | YES   | -                 | 체크아웃 사진 경로         |
| checkout_photo_url      | varchar(500) | YES   | -                 | 체크아웃 사진 URL          |
| checkout_verified_at    | timestamp | YES      | -                 | 체크아웃 검증 일시         |
| checkout_notes          | text      | YES      | -                 | 체크아웃 메모              |
| reservation_createdat   | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                  |
| reservation_updatedat   | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                  |

**예약 상태 (reservation_status) Enum**:
- `pending`: 대기중
- `confirmed`: 확정
- `in_progress`: 진행중
- `awaiting_checkout`: 체크아웃 대기
- `finished`: 완료
- `cancelled`: 취소

**인덱스**:
- PRIMARY KEY: `reservation_id`
- FOREIGN KEY: `room_id` → `room.room_id`
- FOREIGN KEY: `user_id` → `users.user_id`
- INDEX: `reservation_starttime`

**관계**:
- ManyToOne: `room` (Room)
- ManyToOne: `user` (User)

**비고**:
- 체크인 시 `check_in_at`에 타임스탬프 기록
- 예약 시작 시간 후 10분 이내 체크인시 `is_late = true`
- 지각 3회 = 노쇼 1회 자동 전환
- 체크아웃 시 사진 업로드 필수 (`checkout_photo_path`, `checkout_photo_url`)

---

## 5. activity_logs

시스템 활동 로그를 기록하는 테이블

| Column      | Type      | Nullable | Default           | Description                               |
| ----------- | --------- | -------- | ----------------- | ----------------------------------------- |
| id          | integer   | NO       | AUTO_INCREMENT    | 로그 고유 ID (Primary Key)                |
| type        | enum      | NO       | -                 | 활동 타입 (ActivityType)                  |
| title       | varchar   | NO       | -                 | 로그 제목                                 |
| description | text      | YES      | -                 | 로그 설명                                 |
| userId      | integer   | YES      | -                 | 사용자 ID (Foreign Key)                   |
| metadata    | json      | YES      | -                 | 추가 메타데이터                           |
| level       | enum      | NO       | 'info'            | 로그 레벨 (info, success, warning, error) |
| createdAt   | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                                 |

**ActivityType Enum**:
- `ROOM_CREATED`
- `ROOM_UPDATED`
- `ROOM_DELETED`
- `USER_REGISTERED`
- `RESERVATION_CREATED`
- `RESERVATION_CANCELLED`
- `BACKUP_CREATED`
- `BACKUP_RESTORED`
- `SETTINGS_UPDATED`
- `SYSTEM_MAINTENANCE`
- `EXCEL_UPLOAD`

**로그 레벨 (level) Enum**:
- `info`: 정보성 로그
- `success`: 성공 로그
- `warning`: 경고 로그
- `error`: 에러 로그

**인덱스**:
- PRIMARY KEY: `id`
- FOREIGN KEY: `userId` → `users.user_id` (nullable)
- INDEX: `createdAt`

**관계**:
- ManyToOne: `user` (User, nullable)

---

## 6. system_settings

시스템 설정 정보를 관리하는 테이블

| Column      | Type      | Nullable | Default           | Description                |
| ----------- | --------- | -------- | ----------------- | -------------------------- |
| id          | integer   | NO       | AUTO_INCREMENT    | 설정 고유 ID (Primary Key) |
| key         | varchar   | NO       | -                 | 설정 키 (Unique)           |
| value       | jsonb     | NO       | -                 | 설정 값 (JSON)             |
| description | varchar   | YES      | -                 | 설정 설명                  |
| createdAt   | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                  |
| updatedAt   | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                  |

**인덱스**:
- PRIMARY KEY: `id`
- UNIQUE: `key`

**주요 설정 키 예시**:
- `maintenanceMode`: 유지보수 모드 활성화 여부
- `maxReservationDays`: 최대 예약 가능 일수
- `allowConcurrentReservations`: 동시 예약 허용 여부
- `slackWebhookUrl`: Slack 웹훅 URL

---

## ER 다이어그램 (텍스트)

```
┌─────────────────┐
│ users           │
│─────────────────│
│ user_id (PK)    │──┐
│ user_intra_id   │  │
│ user_name       │  │
│ user_password   │  │
│ user_role       │  │
│ ...             │  │
└─────────────────┘  │
                     │ 1:N
                     │
                     │
┌─────────────────┐  │    ┌─────────────────┐
│ reservation     │  │    │ room            │
│─────────────────│  │    │─────────────────│
│ reservation_id  │──┼───<│ room_id (PK)    │
│ room_id (FK)    │──┘    │ room_name       │
│ user_id (FK)    │       │ room_capacity   │
│ title           │       │ ...             │
│ status          │       └─────────────────┘
│ ...             │                │
└─────────────────┘                │ 1:N
        │                          │
        │ M:1                      │
        │                          │
        └──────────────────────────┘

┌───────────────────┐         ┌─────────────────┐
│ slack_verifications│        │ activity_logs   │
│───────────────────│         │─────────────────│
│ id (PK)           │         │ id (PK)         │
│ intra_id          │         │ type            │
│ verification_code │         │ userId (FK)     │──> users
│ is_verified       │         │ ...             │
│ ...               │         └─────────────────┘
└───────────────────┘

┌─────────────────┐
│ system_settings │
│─────────────────│
│ id (PK)         │
│ key (UNIQUE)    │
│ value (JSON)    │
└─────────────────┘
```

---

## 주요 비즈니스 로직

### 노쇼/지각 관리 시스템

1. **지각 처리**
   - 예약 시작 시간 후 10분 이내 체크인시 `is_late = true`
   - `users.late_count` 증가

2. **지각 → 노쇼 자동 전환**
   - `late_count`가 3이 되면 자동으로 `no_show_count` 증가
   - `late_count` 초기화

3. **노쇼 처리**
   - 노쇼 발생 시: 7일간 예약 정지
   - `users.is_reservation_banned = true`
   - `users.ban_until = NOW() + 7 days`

4. **노쇼 3회**
   - 관리자 면담 필요 (별도 처리 필요)

### 예약 상태 전환

```
pending → confirmed → in_progress → awaiting_checkout → finished
   ↓           ↓            ↓
cancelled  cancelled   cancelled
```

### 사용자 역할 및 권한

| 역할    | 권한 레벨 | 설명           |
| ------- | --------- | -------------- |
| student | 1         | 일반 학생      |
| staff   | 2         | 스태프         |
| admin   | 4         | 관리자 (최상위) |

---

## 마이그레이션 가이드

### 개발 환경

TypeORM의 `synchronize: true` 설정으로 자동 동기화됩니다.

```typescript
// backend/src/app.module.ts
TypeOrmModule.forRootAsync({
  // ...
  synchronize: true, // 개발 환경에서만 사용
})
```

### 프로덕션 환경

마이그레이션 파일을 생성하여 수동으로 적용해야 합니다.

```bash
# 마이그레이션 생성
npm run typeorm:migration:generate -- -n MigrationName

# 마이그레이션 실행
npm run typeorm:migration:run

# 마이그레이션 롤백
npm run typeorm:migration:revert
```

---

## 백업 및 복원

### 백업 생성

```bash
# API를 통한 백업 (권장)
POST /admin/backup/create

# 직접 백업 (PostgreSQL)
pg_dump -h localhost -p 6113 -U postgres ggs_helper > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 백업 복원

```bash
# API를 통한 복원 (권장)
POST /admin/backup/restore
{
  "backupId": "backup_20250131_123456"
}

# 직접 복원 (PostgreSQL)
psql -h localhost -p 6113 -U postgres ggs_helper < backup_20250131_123456.sql
```

---

## 참고 문서

- [API 명세](./API.md)
- [개발 환경 셋팅](./START_DEV.md)
- [구현된 기능 목록](./FEAT.md)
- [TypeORM 공식 문서](https://typeorm.io)

---

**최종 수정일**: 2025-01-31
**작성자**: GGS (42경산 개발 동아리)
