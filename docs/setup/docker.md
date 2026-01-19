# Docker 설정 가이드

GGS Helper의 Docker 기반 개발 환경 설정 및 관리 가이드입니다.

## 목차

- [개요](#개요)
- [Docker Compose 구성](#docker-compose-구성)
- [컨테이너 관리](#컨테이너-관리)
- [데이터베이스 관리](#데이터베이스-관리)
- [볼륨 관리](#볼륨-관리)
- [네트워크 설정](#네트워크-설정)
- [문제 해결](#문제-해결)

## 개요

GGS Helper는 개발 환경에서 PostgreSQL 데이터베이스를 Docker 컨테이너로 실행합니다.

### 장점

- **격리된 환경**: 로컬 시스템에 PostgreSQL 설치 불필요
- **일관성**: 모든 개발자가 동일한 데이터베이스 버전 사용
- **간편한 초기화**: 컨테이너 재생성으로 데이터베이스 초기화 가능
- **포트 충돌 방지**: 커스텀 포트(6113) 사용

## Docker Compose 구성

### 파일 위치

`developments/docker-compose.yml`

### 서비스 구성

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: ggs_helper_postgres
    restart: unless-stopped
    ports:
      - '6113:5432'
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

### 주요 설정

| 항목 | 값 | 설명 |
|-----|---|------|
| **이미지** | `postgres:16-alpine` | PostgreSQL 16 Alpine Linux 기반 |
| **컨테이너명** | `ggs_helper_postgres` | 고정된 컨테이너 이름 |
| **포트** | `6113:5432` | 호스트 6113 → 컨테이너 5432 |
| **재시작 정책** | `unless-stopped` | 수동 중지 전까지 자동 재시작 |
| **볼륨** | `postgres_data` | 데이터 영구 저장 |

## 컨테이너 관리

### 시작

```bash
cd developments
docker-compose up -d
```

옵션:
- `-d`: 백그라운드 실행
- `--build`: 이미지 강제 재빌드

### 중지

```bash
docker-compose stop
```

컨테이너를 중지하지만 삭제하지 않습니다. 데이터는 유지됩니다.

### 재시작

```bash
docker-compose restart
```

### 중지 및 제거

```bash
docker-compose down
```

컨테이너를 중지하고 제거합니다. 볼륨은 유지됩니다.

### 완전 제거 (데이터 포함)

```bash
docker-compose down -v
```

**주의**: 볼륨까지 삭제하므로 모든 데이터가 삭제됩니다.

### 상태 확인

```bash
# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs

# 실시간 로그 확인
docker-compose logs -f

# PostgreSQL 전용 로그
docker-compose logs postgres
```

## 데이터베이스 관리

### psql 접속

```bash
# docker-compose 사용
docker-compose exec postgres psql -U postgres -d ggs_helper

# docker 직접 사용
docker exec -it ggs_helper_postgres psql -U postgres -d ggs_helper
```

### 데이터베이스 목록 확인

```sql
\l
```

### 테이블 목록 확인

```sql
\dt
```

### 특정 테이블 구조 확인

```sql
\d users
\d reservations
\d rooms
```

### SQL 파일 실행

```bash
# 파일에서 SQL 실행
cat script.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper

# 또는
docker-compose exec -T postgres psql -U postgres -d ggs_helper < script.sql
```

### 데이터베이스 백업

```bash
# 백업 생성
docker-compose exec -T postgres pg_dump -U postgres ggs_helper > backup.sql

# 날짜 포함 백업
docker-compose exec -T postgres pg_dump -U postgres ggs_helper > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 데이터베이스 복원

```bash
# 기존 데이터베이스 삭제 및 재생성
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS ggs_helper;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE ggs_helper;"

# 백업 복원
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

### 데이터베이스 초기화

```bash
# 방법 1: 컨테이너 및 볼륨 완전 제거 후 재시작
docker-compose down -v
docker-compose up -d

# 방법 2: 데이터베이스만 삭제 후 재생성
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS ggs_helper;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE ggs_helper;"
```

백엔드 서버 재시작 시 TypeORM이 자동으로 테이블을 생성합니다.

## 볼륨 관리

### 볼륨 목록 확인

```bash
docker volume ls | grep ggs_helper
```

### 볼륨 상세 정보

```bash
docker volume inspect developments_postgres_data
```

### 볼륨 위치

Docker Desktop (Windows/Mac):
- 볼륨은 Docker VM 내부에 저장됨
- 직접 파일 시스템 접근 불가

Linux:
- `/var/lib/docker/volumes/developments_postgres_data/_data`

### 볼륨 백업

```bash
# 볼륨 백업 (tar 파일로)
docker run --rm -v developments_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_volume_backup.tar.gz -C /data .

# 볼륨 복원
docker run --rm -v developments_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_volume_backup.tar.gz -C /data
```

## 네트워크 설정

### 네트워크 정보 확인

```bash
docker network ls | grep developments
docker network inspect developments_default
```

### 컨테이너 IP 확인

```bash
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' ggs_helper_postgres
```

### 백엔드에서 연결

Docker 네트워크 내에서 접속 시:
```env
# backend/.env
DATABASE_HOST=postgres  # 서비스명 사용
DATABASE_PORT=5432      # 컨테이너 내부 포트
```

호스트에서 접속 시:
```env
# backend/.env
DATABASE_HOST=localhost
DATABASE_PORT=6113      # 매핑된 포스트 포트
```

## 문제 해결

### 포트 충돌

**증상**: `Bind for 0.0.0.0:6113 failed: port is already allocated`

**해결 방법**:

```bash
# 포트 사용 프로세스 확인 (Windows)
netstat -ano | findstr :6113

# 포트 사용 프로세스 확인 (Mac/Linux)
lsof -i :6113

# 다른 포트 사용
# docker-compose.yml에서 포트 변경 후
docker-compose up -d
```

### 컨테이너 시작 실패

**증상**: 컨테이너가 계속 재시작됨

**해결 방법**:

```bash
# 로그 확인
docker-compose logs postgres

# 일반적인 원인:
# 1. 환경변수 누락 - .env 파일 확인
# 2. 볼륨 권한 문제 - 볼륨 삭제 후 재생성
# 3. PostgreSQL 버전 불일치 - 이미지 버전 확인
```

### 데이터베이스 연결 거부

**증상**: `ECONNREFUSED 127.0.0.1:6113`

**체크리스트**:

1. 컨테이너 실행 확인:
   ```bash
   docker-compose ps
   ```

2. Health check 상태 확인:
   ```bash
   docker inspect ggs_helper_postgres | grep -A 5 Health
   ```

3. 포트 바인딩 확인:
   ```bash
   docker port ggs_helper_postgres
   ```

4. 백엔드 환경변수 확인:
   ```bash
   cat backend/.env | grep DATABASE
   ```

### PostgreSQL 버전 불일치

**증상**: `database files are incompatible with server`

**원인**: 볼륨에 저장된 데이터가 다른 PostgreSQL 버전으로 초기화됨

**해결 방법**:

```bash
# 볼륨 삭제 후 재생성
docker-compose down -v
docker-compose up -d
```

### 컨테이너 이름 충돌

**증상**: `The container name "/ggs_helper_postgres" is already in use`

**해결 방법**:

```bash
# 기존 컨테이너 강제 제거
docker rm -f ggs_helper_postgres

# 또는 docker-compose 사용
docker-compose down
docker-compose up -d
```

### 디스크 공간 부족

```bash
# 사용하지 않는 리소스 정리
docker system prune -a --volumes

# 주의: 다른 프로젝트의 볼륨도 삭제될 수 있음
# 특정 볼륨만 삭제하려면:
docker volume rm developments_postgres_data
```

### 로그 확인

```bash
# 최근 100줄 로그
docker-compose logs --tail=100 postgres

# 특정 시간 이후 로그
docker-compose logs --since 10m postgres

# 실시간 로그 (Ctrl+C로 종료)
docker-compose logs -f postgres
```

## 성능 최적화

### 메모리 설정

PostgreSQL 컨테이너 메모리 제한:

```yaml
services:
  postgres:
    # ...
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
```

### 데이터베이스 튜닝

```bash
# psql 접속 후
docker-compose exec postgres psql -U postgres -d ggs_helper

# 설정 변경 (세션에만 적용)
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

# PostgreSQL 재시작
docker-compose restart postgres
```

## 다음 단계

- [설치 가이드](./installation.md) - 프로젝트 설치 방법
- [환경변수 설정](./environment.md) - 환경변수 상세 설명
- [데이터베이스 스키마](../development/database.md) - 데이터베이스 구조
- [백업 및 복원](../maintenance/backup.md) - 프로덕션 백업 전략
