# Database Tables

## 1. users

사용자 정보를 관리하는 테이블

| Column                | Type      | Nullable | Default           | Description                         |
| --------------------- | --------- | -------- | ----------------- | ----------------------------------- |
| user_id               | integer   | NO       | AUTO_INCREMENT    | 사용자 고유 ID (Primary Key)        |
| user_intraid          | varchar   | NO       | -                 | 42 Intra ID (Unique)                |
| user_name             | varchar   | NO       | -                 | 사용자 이름                         |
| user_isavailable      | boolean   | NO       | true              | 사용자 활성화 상태                  |
| user_profileimgurl    | varchar   | NO       | ''                | 프로필 이미지 URL                   |
| user_role             | enum      | NO       | 'student'         | 사용자 역할 (student, staff, admin) |
| user_createdat        | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                           |
| user_updatedat        | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                           |
| user_refreshtoken     | varchar   | NO       | ''                | Refresh Token                       |
| user_lastloginat      | timestamp | YES      | -                 | 마지막 로그인 일시                  |
| user_grade            | varchar   | NO       | 'Cadet'           | 사용자 등급                         |
| no_show_count         | integer   | NO       | 0                 | 노쇼 횟수                           |
| last_no_show_at       | timestamp | YES      | -                 | 마지막 노쇼 발생 일시               |
| late_count            | integer   | NO       | 0                 | 지각 횟수                           |
| is_reservation_banned | boolean   | NO       | false             | 예약 정지 여부                      |
| ban_until             | timestamp | YES      | -                 | 예약 정지 해제 일시                 |

**Relationships:**

- OneToOne: info (cascade)
- OneToMany: reservations
- OneToMany: club_members
- OneToMany: clubs (as leader via leader_id)

---

## 2. info

사용자의 42 관련 상세 정보를 관리하는 테이블

| Column              | Type         | Nullable | Default        | Description                |
| ------------------- | ------------ | -------- | -------------- | -------------------------- |
| info_id             | integer      | NO       | AUTO_INCREMENT | 정보 고유 ID (Primary Key) |
| user_id             | integer      | NO       | -              | 사용자 ID (Foreign Key)    |
| info_studytime      | decimal(8,2) | NO       | 0              | 학습 시간                  |
| info_level          | decimal(8,2) | NO       | 0              | 레벨                       |
| info_wallet         | integer      | NO       | 0              | 지갑                       |
| info_evalpoint      | integer      | NO       | 0              | 평가 포인트                |
| info_activeproject  | text         | NO       | '[]'           | 활성 프로젝트 (JSON 형식)  |
| info_coalition      | varchar      | NO       | ''             | 연합 정보                  |
| info_lastupdateedat | timestamp    | YES      | -              | 마지막 업데이트 일시       |

**Relationships:**

- OneToOne: user (user_id)

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
| room_is_confirm  | boolean   | NO       | true              | 관리자 승인 여부         |
| room_createdat   | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                |
| room_updatedat   | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                |

**Relationships:**

- OneToMany: reservations

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
| reservation_createdat   | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                  |
| reservation_updatedat   | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                  |

**Relationships:**

- ManyToOne: room (room_id)
- ManyToOne: user (user_id)

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

**ActivityType Enum:**

- ROOM_CREATED
- ROOM_UPDATED
- ROOM_DELETED
- USER_REGISTERED
- RESERVATION_CREATED
- RESERVATION_CANCELLED
- BACKUP_CREATED
- BACKUP_RESTORED
- SETTINGS_UPDATED
- SYSTEM_MAINTENANCE
- EXCEL_UPLOAD
- CLUB_APPROVED
- CLUB_REJECTED
- CLUB_CREATED
- CLUB_UPDATED
- CLUB_DELETED

**Relationships:**

- ManyToOne: user (userId, nullable)

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

---

## 7. clubs

동아리 정보를 관리하는 테이블

| Column        | Type      | Nullable | Default           | Description                |
| ------------- | --------- | -------- | ----------------- | -------------------------- |
| id            | integer   | NO       | AUTO_INCREMENT    | 동아리 고유 ID (Primary Key) |
| name          | varchar   | NO       | -                 | 동아리 명                   |
| leader_id     | integer   | NO       | -                 | 동아리장 ID (Foreign Key)   |
| description   | text      | YES      | -                 | 동아리 설명                 |
| count_member  | integer   | YES      | 0                 | 동아리 회원 수 (캐시)        |
| createdAt     | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                   |
| updatedAt     | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                   |

**Relationships:**
- ManyToOne: user (leader_id)
- OneToMany: club_members

---

## 8. club_members

동아리원 정보를 관리하는 테이블

| Column    | Type      | Nullable | Default           | Description                                            |
| --------- | --------- | -------- | ----------------- | ------------------------------------------------------ |
| id        | integer   | NO       | AUTO_INCREMENT    | 동아리원 고유 ID (Primary Key)                          |
| club_id   | integer   | NO       | -                 | 동아리 ID (Foreign Key)                                |
| user_id   | integer   | NO       | -                 | 사용자 ID (Foreign Key)                                |
| role      | enum      | NO       | 'member'          | 동아리 회원 역할 (member, leader, staff)                |
| status    | enum      | NO       | 'active'          | 동아리 회원 상태 (freeze, active, work, inactive)       |
| createdAt | timestamp | NO       | CURRENT_TIMESTAMP | 생성 일시                                              |
| updatedAt | timestamp | NO       | CURRENT_TIMESTAMP | 수정 일시                                              |

**Constraints:**
- Unique: (club_id, user_id) - 한 동아리에 동일 사용자 중복 가입 방지

**Relationships:**
- ManyToOne: club (club_id)
- ManyToOne: user (user_id)

---

## ER Diagram (Text)

```
users (1) ----< (M) reservations (M) >---- (1) room
  |
  | (1:1)
  |
info

users (1) ----< (M) activity_logs

users (1) ----< (M) club_members (M) >---- (1) clubs
  |                                           |
  | (leader)                                  |
  +-------------------------------------------+
```

## Key Features

### 노쇼/지각 관리 시스템

- **지각**: 예약 시작 시간 후 10분 이내 체크인시 `is_late = true`
- **지각 3회 = 노쇼 1회**: `late_count`가 3이 되면 자동으로 `no_show_count` 증가
- **노쇼 발생시**: 7일간 예약 정지 (`is_reservation_banned = true`, `ban_until` 설정)
- **노쇼 3회**: 관리자 면담 필요

### 사용자 역할

- **student**: 일반 학생
- **staff**: 스태프
- **admin**: 관리자
