-- Add late_count column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS late_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN users.late_count IS '지각 횟수 (3회 초과시 노쇼 카운트 1회 추가)';
