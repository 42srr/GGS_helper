-- Add is_late column to reservation table
ALTER TABLE reservation
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN reservation.is_late IS '지각 여부 (시작 후 10~30분 사이 체크인)';
