# PostgreSQL Development Database

개발 환경용 PostgreSQL 데이터베이스 설정

## 사용 방법

### 1. 환경 변수 설정

최초 1회만 실행:

```bash
cd development
cp .env.example .env
# 필요시 .env 파일 수정
```

### 2. 데이터베이스 시작

```bash
cd development
docker compose up -d
```

### 3. 데이터베이스 상태 확인

```bash
docker compose ps
```

### 4. 데이터베이스 로그 확인

```bash
docker compose logs -f postgres
```

### 5. 데이터베이스 중지

```bash
docker compose down
```

### 6. 데이터베이스 완전 초기화 (데이터 삭제)

```bash
# 컨테이너 및 볼륨 삭제
docker compose down -v

# 다시 시작
docker compose up -d
```

## 데이터베이스 접속 정보

환경변수로 설정 가능 (`.env` 파일 참조):

- **Host**: localhost
- **Port**: 6113 (기본값, `.env`에서 변경 가능)
- **Database**: ggs_helper (기본값, `.env`에서 변경 가능)
- **User**: postgres (기본값, `.env`에서 변경 가능)
- **Password**: postgres (기본값, `.env`에서 변경 가능)

## 직접 접속 (psql)

```bash
docker exec -it ggs_helper_postgres psql -U postgres -d ggs_helper
```

## 백엔드 환경 변수 설정

`backend/.env` 파일에 다음과 같이 설정:

```env
DATABASE_HOST=localhost
DATABASE_PORT=6113
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=ggs_helper
```

## 초기화 스크립트

`init-scripts/` 디렉토리에 `.sql` 파일을 추가하면 데이터베이스 초기 생성 시 자동 실행됩니다.

## 주의사항

- 이 설정은 **개발 환경 전용**입니다
- 운영 환경에서는 강력한 비밀번호를 사용하세요
- 데이터는 Docker 볼륨에 저장되므로 `docker compose down -v`를 실행하면 완전히 삭제됩니다
