-- 데이터베이스 초기화 스크립트
-- 필요시 추가적인 설정이나 초기 데이터를 여기에 추가할 수 있습니다.

-- 예시: 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 동아리 테이블 생성 (TypeORM synchronize가 활성화되어 있지만, 명시적으로 추가)
CREATE TABLE IF NOT EXISTS clubs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    leader_id INTEGER NOT NULL,
    description TEXT,
    count_member INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clubs_leader FOREIGN KEY (leader_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 동아리 멤버 테이블 생성
CREATE TABLE IF NOT EXISTS club_members (
    id SERIAL PRIMARY KEY,
    club_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'staff')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('freeze', 'active', 'work', 'inactive')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_club_members_club FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
    CONSTRAINT fk_club_members_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT unique_club_user UNIQUE (club_id, user_id)
);

-- 인덱스 생성 (검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_clubs_name ON clubs(name);
CREATE INDEX IF NOT EXISTS idx_clubs_leader_id ON clubs(leader_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_user_id ON club_members(user_id);
CREATE INDEX IF NOT EXISTS idx_club_members_status ON club_members(status);

-- 예시: 인덱스 생성 (TypeORM이 자동으로 생성하므로 일반적으로 불필요)
-- CREATE INDEX IF NOT EXISTS idx_users_intra_id ON users(intra_id);
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
