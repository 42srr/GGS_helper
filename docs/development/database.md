# 데이터베이스 스키마

GGS Helper의 PostgreSQL 데이터베이스 스키마와 관계를 설명합니다.

## 목차

- [ER 다이어그램](#er-다이어그램)
- [테이블 목록](#테이블-목록)
- [테이블 상세](#테이블-상세)
- [관계(Relationships)](#관계relationships)
- [인덱스](#인덱스)
- [제약조건](#제약조건)

## ER 다이어그램

```
┌─────────────────┐           ┌──────────────────┐           ┌─────────────────┐
│     users       │           │   reservation    │           │      room       │
├─────────────────┤           ├──────────────────┤           ├─────────────────┤
│ user_id (PK)    │◄──────────┤ user_id (FK)     │           │ room_id (PK)    │
│ user_username   │    1:N    │ room_id (FK)     ├──────────►│ room_name       │
│ user_email      │           │ reservation_id   │    N:1    │ room_location   │
│ user_password   │           │   (PK)           │           │ room_capacity   │
│ user_name       │           │ reservation_title│           │ room_equipment  │
│ user_phone      │           │ reservation_     │           │ room_isavailable│
│ user_role       │           │   starttime      │           │ room_is_confirm │
│ user_isavailable│           │ reservation_     │           │ room_createdat  │
│ no_show_count   │           │   endtime        │           │ room_updatedat  │
│ late_count      │           │ reservation_     │           └─────────────────┘
│ is_reservation_ │           │   status         │
│   banned        │           │ is_no_show       │
│ ban_until       │           │ check_in_at      │
│ user_createdat  │           │ is_late          │
│ user_updatedat  │           │ checkout_photo_  │
│ user_lastloginat│           │   path           │
└─────────────────┘           │ checkout_verified│
                              │   _at            │
                              │ reservation_     │
                              │   createdat      │
                              │ reservation_     │
                              │   updatedat      │
                              └──────────────────┘
```

## 테이블 목록

| 테이블명 | 설명 | 주요 용도 |
|---------|------|----------|
| `users` | 사용자 정보 | 회원 관리, 인증 |
| `room` | 회의실 정보 | 회의실 관리 |
| `reservation` | 예약 정보 | 예약 관리, 일정 관리 |
| `activity_log` | 활동 로그 | 관리자 활동 추적 |
| `system_settings` | 시스템 설정 | 애플리케이션 설정 |

## 테이블 상세

### users

사용자 계정 정보를 저장합니다.

| 컬럼명 | 타입 | 제약 | 기본값 | 설명 |
|-------|------|------|--------|------|
| `user_id` | INTEGER | PK, AUTO | - | 사용자 ID |
| `user_username` | VARCHAR(50) | UNIQUE, NOT NULL | - | 로그인 아이디 |
| `user_email` | VARCHAR(255) | UNIQUE, NOT NULL | - | 이메일 |
| `user_password` | VARCHAR(255) | NOT NULL | - | bcrypt 해시 |
| `user_name` | VARCHAR(100) | NOT NULL | - | 이름 |
| `user_phone` | VARCHAR(20) | NULLABLE | - | 전화번호 |
| `user_role` | ENUM | NOT NULL | 'student' | 역할 (student/staff/admin) |
| `user_isavailable` | BOOLEAN | NOT NULL | true | 계정 활성화 |
| `no_show_count` | INTEGER | NOT NULL | 0 | 노쇼 횟수 |
| `last_no_show_at` | TIMESTAMP | NULLABLE | - | 마지막 노쇼 시각 |
| `late_count` | INTEGER | NOT NULL | 0 | 지각 횟수 |
| `is_reservation_banned` | BOOLEAN | NOT NULL | false | 예약 금지 여부 |
| `ban_until` | TIMESTAMP | NULLABLE | - | 예약 금지 해제 시각 |
| `user_createdat` | TIMESTAMP | AUTO | NOW() | 생성 시각 |
| `user_updatedat` | TIMESTAMP | AUTO | NOW() | 수정 시각 |
| `user_lastloginat` | TIMESTAMP | NULLABLE | - | 마지막 로그인 시각 |

**인덱스:**
- `user_id` (PK)
- `user_username` (UNIQUE)
- `user_email` (UNIQUE)

**관계:**
- `reservation` → `users` (1:N)

### room

회의실 정보를 저장합니다.

| 컬럼명 | 타입 | 제약 | 기본값 | 설명 |
|-------|------|------|--------|------|
| `room_id` | INTEGER | PK, AUTO | - | 회의실 ID |
| `room_name` | VARCHAR(255) | NOT NULL | - | 회의실 이름 |
| `room_description` | TEXT | NULLABLE | - | 설명 |
| `room_location` | VARCHAR(255) | NULLABLE | - | 위치 |
| `room_capacity` | INTEGER | NULLABLE | - | 수용 인원 |
| `room_equipment` | TEXT | NULLABLE | - | 장비 목록 |
| `room_isavailable` | BOOLEAN | NOT NULL | true | 사용 가능 여부 |
| `room_is_confirm` | BOOLEAN | NOT NULL | true | 즉시 승인 여부 |
| `room_createdat` | TIMESTAMP | AUTO | NOW() | 생성 시각 |
| `room_updatedat` | TIMESTAMP | AUTO | NOW() | 수정 시각 |

**인덱스:**
- `room_id` (PK)

**관계:**
- `reservation` → `room` (N:1)

### reservation

예약 정보를 저장합니다.

| 컬럼명 | 타입 | 제약 | 기본값 | 설명 |
|-------|------|------|--------|------|
| `reservation_id` | INTEGER | PK, AUTO | - | 예약 ID |
| `room_id` | INTEGER | FK, NOT NULL | - | 회의실 ID |
| `user_id` | INTEGER | FK, NOT NULL | - | 사용자 ID |
| `reservation_title` | VARCHAR(255) | NOT NULL | - | 예약 제목 |
| `reservation_description` | TEXT | NULLABLE | - | 예약 설명 |
| `reservation_starttime` | TIMESTAMP | NOT NULL | - | 시작 시간 |
| `reservation_endtime` | TIMESTAMP | NOT NULL | - | 종료 시간 |
| `reservation_attendees` | INTEGER | NOT NULL | 0 | 참석 인원 |
| `team_name` | VARCHAR(255) | NULLABLE | - | 팀 이름 |
| `reservation_status` | VARCHAR(50) | NOT NULL | 'confirmed' | 예약 상태 |
| `is_no_show` | BOOLEAN | NOT NULL | false | 노쇼 여부 |
| `no_show_reported_at` | TIMESTAMP | NULLABLE | - | 노쇼 신고 시각 |
| `no_show_report_count` | INTEGER | NOT NULL | 0 | 노쇼 신고 횟수 |
| `check_in_at` | TIMESTAMP | NULLABLE | - | 체크인 시각 |
| `is_late` | BOOLEAN | NOT NULL | false | 지각 여부 |
| `checkout_photo_path` | VARCHAR(500) | NULLABLE | - | 체크아웃 사진 경로 |
| `checkout_photo_url` | VARCHAR(500) | NULLABLE | - | 체크아웃 사진 URL |
| `checkout_verified_at` | TIMESTAMP | NULLABLE | - | 체크아웃 승인 시각 |
| `checkout_notes` | TEXT | NULLABLE | - | 체크아웃 메모 |
| `reservation_createdat` | TIMESTAMP | AUTO | NOW() | 생성 시각 |
| `reservation_updatedat` | TIMESTAMP | AUTO | NOW() | 수정 시각 |

**예약 상태 (reservation_status):**
- `pending`: 승인 대기
- `confirmed`: 승인됨 (예약 확정)
- `in_progress`: 진행 중 (체크인 완료)
- `awaiting_checkout`: 체크아웃 대기 (사진 업로드 완료)
- `finished`: 완료 (체크아웃 승인)
- `cancelled`: 취소됨

**인덱스:**
- `reservation_id` (PK)
- `room_id` (FK, INDEX)
- `user_id` (FK, INDEX)
- `reservation_starttime` (INDEX)
- `reservation_status` (INDEX)

**관계:**
- `reservation.room_id` → `room.room_id`
- `reservation.user_id` → `users.user_id`

### activity_log

관리자 활동 로그를 저장합니다.

| 컬럼명 | 타입 | 제약 | 기본값 | 설명 |
|-------|------|------|--------|------|
| `activity_log_id` | INTEGER | PK, AUTO | - | 로그 ID |
| `user_id` | INTEGER | FK, NOT NULL | - | 관리자 ID |
| `action` | VARCHAR(255) | NOT NULL | - | 수행한 작업 |
| `target_type` | VARCHAR(50) | NULLABLE | - | 대상 타입 (user/room/reservation) |
| `target_id` | INTEGER | NULLABLE | - | 대상 ID |
| `details` | TEXT | NULLABLE | - | 상세 정보 (JSON) |
| `created_at` | TIMESTAMP | AUTO | NOW() | 발생 시각 |

**인덱스:**
- `activity_log_id` (PK)
- `user_id` (FK, INDEX)
- `created_at` (INDEX)

### system_settings

시스템 설정을 저장합니다.

| 컬럼명 | 타입 | 제약 | 기본값 | 설명 |
|-------|------|------|--------|------|
| `setting_key` | VARCHAR(255) | PK | - | 설정 키 |
| `setting_value` | TEXT | NOT NULL | - | 설정 값 (JSON) |
| `setting_description` | TEXT | NULLABLE | - | 설명 |
| `updated_at` | TIMESTAMP | AUTO | NOW() | 수정 시각 |

**인덱스:**
- `setting_key` (PK)

## 관계(Relationships)

### 1:N 관계

#### users → reservations

한 사용자는 여러 개의 예약을 가질 수 있습니다.

```sql
-- TypeORM Entity 정의
@OneToMany(() => Reservation, (reservation) => reservation.user)
reservations: Reservation[];
```

**관계 설정:**
- Parent: `users.user_id`
- Child: `reservation.user_id`
- Cascade: 없음 (사용자 삭제 시 예약 유지)

#### room → reservations

한 회의실은 여러 개의 예약을 가질 수 있습니다.

```sql
-- TypeORM Entity 정의
@OneToMany(() => Reservation, (reservation) => reservation.room)
reservations: Reservation[];
```

**관계 설정:**
- Parent: `room.room_id`
- Child: `reservation.room_id`
- Cascade: 없음 (회의실 삭제 시 예약 유지)

### N:1 관계

#### reservations → users

각 예약은 하나의 사용자에게 속합니다.

```sql
-- TypeORM Entity 정의
@ManyToOne(() => User, (user) => user.reservations)
@JoinColumn({ name: 'user_id' })
user: User;
```

#### reservations → room

각 예약은 하나의 회의실에 속합니다.

```sql
-- TypeORM Entity 정의
@ManyToOne(() => Room, (room) => room.reservations)
@JoinColumn({ name: 'room_id' })
room: Room;
```

## 인덱스

### 성능 최적화를 위한 인덱스

```sql
-- users
CREATE INDEX idx_users_username ON users(user_username);
CREATE INDEX idx_users_email ON users(user_email);

-- reservation
CREATE INDEX idx_reservation_room ON reservation(room_id);
CREATE INDEX idx_reservation_user ON reservation(user_id);
CREATE INDEX idx_reservation_starttime ON reservation(reservation_starttime);
CREATE INDEX idx_reservation_status ON reservation(reservation_status);

-- Composite Index for conflict checking
CREATE INDEX idx_reservation_room_time
ON reservation(room_id, reservation_starttime, reservation_endtime);

-- activity_log
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created ON activity_log(created_at);
```

### 인덱스 사용 쿼리 예시

```sql
-- 특정 회의실의 특정 날짜 예약 조회 (인덱스 활용)
SELECT * FROM reservation
WHERE room_id = 1
  AND reservation_starttime >= '2024-01-20 00:00:00'
  AND reservation_starttime < '2024-01-21 00:00:00'
  AND reservation_status != 'cancelled'
ORDER BY reservation_starttime;

-- 예약 충돌 체크 (Composite 인덱스 활용)
SELECT COUNT(*) FROM reservation
WHERE room_id = 1
  AND reservation_status NOT IN ('cancelled')
  AND (
    (reservation_starttime < '2024-01-20 16:00:00'
     AND reservation_endtime > '2024-01-20 14:00:00')
  );
```

## 제약조건

### Primary Key Constraints

```sql
ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
ALTER TABLE room ADD CONSTRAINT room_pkey PRIMARY KEY (room_id);
ALTER TABLE reservation ADD CONSTRAINT reservation_pkey PRIMARY KEY (reservation_id);
```

### Unique Constraints

```sql
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (user_username);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (user_email);
```

### Foreign Key Constraints

```sql
ALTER TABLE reservation
ADD CONSTRAINT fk_reservation_user
FOREIGN KEY (user_id) REFERENCES users(user_id);

ALTER TABLE reservation
ADD CONSTRAINT fk_reservation_room
FOREIGN KEY (room_id) REFERENCES room(room_id);

ALTER TABLE activity_log
ADD CONSTRAINT fk_activity_user
FOREIGN KEY (user_id) REFERENCES users(user_id);
```

### Check Constraints

```sql
-- 예약 시간 검증: endTime > startTime
ALTER TABLE reservation
ADD CONSTRAINT chk_reservation_time
CHECK (reservation_endtime > reservation_starttime);

-- 참석 인원은 양수
ALTER TABLE reservation
ADD CONSTRAINT chk_attendees_positive
CHECK (reservation_attendees >= 0);

-- 회의실 수용 인원은 양수
ALTER TABLE room
ADD CONSTRAINT chk_capacity_positive
CHECK (room_capacity > 0);
```

## 일반적인 쿼리 패턴

### 예약 충돌 체크

```sql
SELECT COUNT(*) FROM reservation
WHERE room_id = $1
  AND reservation_status NOT IN ('cancelled')
  AND (
    (reservation_starttime < $3 AND reservation_endtime > $2)
  );
```

변수:
- `$1`: roomId
- `$2`: 새 예약의 startTime
- `$3`: 새 예약의 endTime

### 사용자의 예약 조회 (관계 포함)

```sql
SELECT
  r.*,
  room.room_name,
  room.room_location
FROM reservation r
JOIN room ON r.room_id = room.room_id
WHERE r.user_id = $1
  AND r.reservation_status != 'cancelled'
ORDER BY r.reservation_starttime DESC;
```

### 회의실별 예약 통계

```sql
SELECT
  room.room_id,
  room.room_name,
  COUNT(r.reservation_id) as total_reservations,
  SUM(CASE WHEN r.is_no_show THEN 1 ELSE 0 END) as no_show_count
FROM room
LEFT JOIN reservation r ON room.room_id = r.room_id
WHERE r.reservation_starttime >= $1
  AND r.reservation_starttime < $2
GROUP BY room.room_id, room.room_name
ORDER BY total_reservations DESC;
```

## 마이그레이션

TypeORM의 자동 동기화 기능 사용:

```typescript
// backend/src/app.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  synchronize: true, // 개발 환경에서만 사용
  // ...
})
```

**프로덕션 환경:**
- `synchronize: false` 설정
- 수동 마이그레이션 파일 사용 권장

마이그레이션 생성:

```bash
npm run typeorm migration:generate -- -n MigrationName
npm run typeorm migration:run
```

## 백업 및 복원

### 전체 백업

```bash
docker-compose exec -T postgres pg_dump -U postgres ggs_helper > backup.sql
```

### 특정 테이블 백업

```bash
docker-compose exec -T postgres pg_dump -U postgres -t reservation ggs_helper > reservations_backup.sql
```

### 복원

```bash
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

## 다음 단계

- [시스템 아키텍처](./architecture.md) - 전체 시스템 구조
- [API 가이드](./api-guide.md) - API 엔드포인트
- [백업 및 복원](../maintenance/backup.md) - 데이터베이스 백업 전략
