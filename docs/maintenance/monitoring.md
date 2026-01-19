# 모니터링

GGS Helper의 시스템 모니터링 및 로깅 가이드입니다.

## 모니터링 항목

### 1. 애플리케이션 상태

**PM2 모니터링:**

```bash
# 실시간 모니터링
pm2 monit

# 상태 확인
pm2 status

# 로그 확인
pm2 logs ggs-backend --lines 100
```

### 2. 데이터베이스

**PostgreSQL 상태:**

```bash
# 연결 수 확인
docker-compose exec postgres psql -U postgres -d ggs_helper -c "SELECT count(*) FROM pg_stat_activity;"

# 데이터베이스 크기
docker-compose exec postgres psql -U postgres -d ggs_helper -c "SELECT pg_size_pretty(pg_database_size('ggs_helper'));"

# 테이블별 크기
docker-compose exec postgres psql -U postgres -d ggs_helper -c "
  SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass))
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(tablename::regclass) DESC;
"
```

### 3. 시스템 리소스

**CPU/메모리:**

```bash
# PM2 리소스 사용량
pm2 show ggs-backend

# Docker 리소스
docker stats ggs_helper_postgres

# 서버 전체
htop
```

### 4. 디스크 사용량

```bash
# 전체 디스크
df -h

# 백업 폴더
du -sh /path/to/backups

# 업로드 폴더
du -sh backend/uploads
```

## 로깅

### 애플리케이션 로그

**NestJS Logger:**

```typescript
// main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'log'],
});
```

**로그 레벨:**
- `error`: 오류
- `warn`: 경고
- `log`: 정보
- `debug`: 디버그
- `verbose`: 상세

### PM2 로그 관리

```bash
# 로그 로케이션 설치
pm2 install pm2-logrotate

# 설정
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
pm2 set pm2-logrotate:compress true
```

### 로그 파일 위치

```
~/.pm2/logs/
├── ggs-backend-error.log
└── ggs-backend-out.log
```

## 성능 모니터링

### API 응답 시간

```typescript
// performance.middleware.ts
@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: Function) {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) {
        console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
    });

    next();
  }
}
```

### 데이터베이스 쿼리

```sql
-- 느린 쿼리 찾기
SELECT
  query,
  calls,
  total_time,
  mean_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY total_time DESC
LIMIT 10;
```

## 알림 설정

### 이메일 알림

```typescript
// monitoring.service.ts
async sendAlert(subject: string, message: string) {
  await this.mailer.sendMail({
    to: process.env.ADMIN_EMAIL,
    subject: `[GGS Helper] ${subject}`,
    text: message,
  });
}
```

### Slack 알림

```typescript
// slack.service.ts
async sendSlackAlert(message: string) {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: message,
  });
}
```

## 헬스 체크

### Endpoint 추가

```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('db')
  async checkDatabase() {
    const result = await this.connection.query('SELECT 1');
    return {
      database: result ? 'ok' : 'error',
    };
  }
}
```

### 외부 모니터링

**UptimeRobot / Pingdom:**

```
URL: https://api.your-domain.com/health
Interval: 5 minutes
Alert: Email, SMS
```

## 메트릭 수집

### Prometheus + Grafana (선택)

**설치:**

```yaml
# docker-compose.monitoring.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

## 로그 분석

### 일반적인 로그 패턴

```bash
# 오늘의 오류 로그
pm2 logs ggs-backend --lines 1000 | grep ERROR

# Rate limit 초과
pm2 logs ggs-backend | grep "Too Many Requests"

# 로그인 실패
pm2 logs ggs-backend | grep "Unauthorized"

# 데이터베이스 오류
pm2 logs ggs-backend | grep "database"
```

## 보안 모니터링

### 의심스러운 활동

```sql
-- 로그인 실패 횟수
SELECT
  user_id,
  COUNT(*) as failed_attempts,
  MAX(created_at) as last_attempt
FROM activity_log
WHERE action = 'login_failed'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 5;

-- 관리자 활동 로그
SELECT * FROM activity_log
WHERE user_id IN (SELECT user_id FROM users WHERE user_role = 'admin')
ORDER BY created_at DESC
LIMIT 100;
```

## 다음 단계

- [백업 및 복원](./backup.md)
- [업데이트](./updates.md)
- [문제 해결](../deployment/troubleshooting.md)
