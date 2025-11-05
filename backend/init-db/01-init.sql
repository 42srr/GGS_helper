-- 데이터베이스 초기화 스크립트
-- 필요시 추가적인 설정이나 초기 데이터를 여기에 추가할 수 있습니다.

-- 예시: 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 예시: 인덱스 생성 (TypeORM이 자동으로 생성하므로 일반적으로 불필요)
-- CREATE INDEX IF NOT EXISTS idx_users_intra_id ON users(intra_id);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);