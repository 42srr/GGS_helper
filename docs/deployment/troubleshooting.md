# 문제 해결 가이드

GGS Helper에서 발생할 수 있는 일반적인 문제와 해결 방법입니다.

## 백엔드 문제

### 서버가 시작되지 않음

**증상:** `npm run start:dev` 실행 시 오류

**원인 및 해결:**

1. **포트 충돌**
   ```bash
   # 포트 사용 확인 (Windows)
   netstat -ano | findstr :6112

   # 프로세스 종료
   taskkill /PID <PID> /F
   ```

2. **환경변수 누락**
   ```bash
   # .env 파일 확인
   cat backend/.env

   # 필수 변수: DATABASE_*, JWT_SECRET, PORT
   ```

3. **의존성 문제**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 데이터베이스 연결 실패

**증상:** `ECONNREFUSED` 또는 `authentication failed`

**해결:**

```bash
# Docker 컨테이너 상태 확인
cd developments
docker-compose ps

# 컨테이너 재시작
docker-compose restart

# 환경변수 일치 확인
# backend/.env의 DATABASE_* ↔ developments/.env의 POSTGRES_*
```

### TypeORM 마이그레이션 오류

**증상:** `schema sync failed`

**해결:**

```bash
# 개발 환경: synchronize: true 사용
# 테이블이 자동 생성됨

# 프로덕션: 수동 마이그레이션
npm run typeorm migration:run
```

## 프론트엔드 문제

### Vite 개발 서버가 시작되지 않음

**증상:** `Port 6111 is already in use`

**해결:**

```bash
# 프로세스 확인 및 종료
lsof -ti:6111 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :6111   # Windows

# 또는 다른 포트 사용
vite --port 6112
```

### API 요청 실패 (CORS 오류)

**증상:** `Access to fetch blocked by CORS policy`

**해결:**

```typescript
// backend/main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN,  // http://localhost:6111
  credentials: true,
});

// frontend/.env
VITE_API_BASE_URL=http://localhost:6112
```

### 빌드 오류

**증상:** `npm run build` 실패

**해결:**

```bash
# 타입 체크
npm run type-check

# 캐시 클리어
rm -rf node_modules/.vite
npm run build
```

## 인증 문제

### 로그인 후 401 Unauthorized

**원인:** 토큰이 블랙리스트에 있거나 만료됨

**해결:**

```typescript
// localStorage 확인
console.log(localStorage.getItem('accessToken'));

// 토큰 디코딩 (jwt.io)
// exp 필드 확인

// 토큰 재발급
localStorage.removeItem('accessToken');
// 다시 로그인
```

### 관리자 페이지 접근 불가

**증상:** 403 Forbidden

**확인:**

```sql
-- 사용자 role 확인
SELECT user_username, user_role FROM users WHERE user_username = 'admin';

-- role이 'admin'인지 확인
```

## 예약 문제

### 예약 충돌 오류 (실제 충돌 없음)

**원인:** 시간대(Timezone) 불일치

**해결:**

```typescript
// 프론트엔드: ISO 8601 형식 사용
const startTime = new Date('2024-01-20T14:00:00Z');  // UTC

// 백엔드: TypeORM timestamp 컬럼 사용
@Column({ type: 'timestamp' })
startTime: Date;
```

### 체크아웃 사진 업로드 실패

**원인:** 파일 크기 초과 또는 형식 불일치

**확인:**

```typescript
// 제한 확인
MAX_FILE_SIZE = 20MB
ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

// 파일 크기 확인
console.log(file.size / 1024 / 1024, 'MB');
```

## Docker 문제

### PostgreSQL 버전 불일치

**증상:** `database files are incompatible with server`

**해결:**

```bash
# 볼륨 삭제 후 재생성
docker-compose down -v
docker-compose up -d
```

### 컨테이너 이름 충돌

**증상:** `container name already in use`

**해결:**

```bash
docker rm -f ggs_helper_postgres
docker-compose up -d
```

## 성능 문제

### API 응답이 느림

**원인:**
1. N+1 쿼리
2. 인덱스 부재
3. 대량 데이터

**해결:**

```typescript
// Eager loading 사용
const reservations = await reservationRepository.find({
  relations: ['room', 'user'],
});

// 필요한 필드만 select
const reservations = await reservationRepository.find({
  select: ['reservationId', 'title', 'startTime'],
});

// 페이지네이션
const [items, total] = await reservationRepository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
});
```

### 프론트엔드 렌더링이 느림

**해결:**

```tsx
// React.memo 사용
export const ReservationCard = React.memo(({ reservation }) => {
  // ...
});

// useCallback 사용
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// 리스트 가상화
import { VirtualList } from 'react-virtual';
```

## Rate Limit 초과

**증상:** `429 Too Many Requests`

**해결:**

```bash
# 대기 후 재시도
# 또는 관리자가 제한 완화

# backend/.env
THROTTLE_TTL=60
THROTTLE_LIMIT=200  # 100에서 200으로 증가
```

## 로그 확인

### 백엔드 로그

```bash
# PM2 사용 시
pm2 logs ggs-backend

# 개발 모드
npm run start:dev
# 콘솔에 로그 출력
```

### 데이터베이스 로그

```bash
# Docker 로그
docker-compose logs postgres

# PostgreSQL 쿼리 로그 활성화
# postgresql.conf
log_statement = 'all'
```

## 긴급 복구

### 데이터베이스 복원

```bash
# 최신 백업 복원
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

### 서비스 재시작

```bash
# 백엔드
pm2 restart ggs-backend

# Docker
docker-compose restart

# Nginx
sudo systemctl restart nginx
```

## 다음 단계

- [프로덕션 배포](./production.md)
- [백업 및 복원](../maintenance/backup.md)
- [모니터링](../maintenance/monitoring.md)
