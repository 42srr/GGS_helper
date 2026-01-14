-- Migration: Add 'awaiting_checkout' status to reservation table
-- Date: 2026-01-14
-- Description: 회의실 반납 시 이미지 업로드 필수화를 위한 새로운 예약 상태 추가

-- 1. 기존 reservation_status 체크 제약 조건 확인
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'reservation'::regclass
--   AND conname LIKE '%status%';

-- 2. 기존 제약 조건 삭제 (있다면)
ALTER TABLE reservation DROP CONSTRAINT IF EXISTS reservation_status_check;

-- 3. 새 제약 조건 추가 (awaiting_checkout 포함)
ALTER TABLE reservation
  ADD CONSTRAINT reservation_status_check
  CHECK (reservation_status IN (
    'pending',
    'confirmed',
    'in_progress',
    'awaiting_checkout',
    'finished',
    'cancelled'
  ));

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reservation_awaiting_checkout
  ON reservation (reservation_status, reservation_endtime)
  WHERE reservation_status = 'awaiting_checkout';

-- 5. 설명 추가
COMMENT ON CONSTRAINT reservation_status_check ON reservation IS
'Reservation status check constraint including awaiting_checkout for mandatory checkout photo upload';

-- 6. 마이그레이션 완료 확인
SELECT
  constraint_name,
  constraint_type,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'reservation_status_check';

-- Expected result:
-- awaiting_checkout 상태가 제약 조건에 포함되어 있어야 함
