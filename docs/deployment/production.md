# 프로덕션 배포 가이드

GGS Helper의 프로덕션 환경 배포 방법을 설명합니다.

## 배포 전 체크리스트

### 환경변수 설정

- [ ] `NODE_ENV=production`
- [ ] `JWT_SECRET` 변경 (강력한 랜덤 키)
- [ ] `DATABASE_PASSWORD` 변경
- [ ] `FRONTEND_URL` 변경 (실제 도메인)
- [ ] `CORS_ORIGIN` 변경
- [ ] `LOG_LEVEL=info` 또는 `warn`

### 보안 설정

- [ ] TypeORM `synchronize: false` 설정
- [ ] HTTPS 활성화
- [ ] 방화벽 설정
- [ ] Redis 설치 (Token Blacklist)
- [ ] 민감한 정보 환경변수화

### 성능 최적화

- [ ] 프론트엔드 빌드 최적화
- [ ] 데이터베이스 인덱스 확인
- [ ] CDN 설정 (정적 파일)
- [ ] Gzip 압축 활성화

## 배포 아키텍처

```
[Internet]
    │
    ▼
[Load Balancer / Nginx]
    │
    ├──────────────┬──────────────┐
    ▼              ▼              ▼
[Frontend]    [Backend]     [Backend]
  (Static)    (Node.js)     (Node.js)
                │              │
                └──────┬───────┘
                       ▼
                 [PostgreSQL]
                       │
                       ▼
                   [Redis]
```

## 백엔드 배포

### 1. 프로덕션 빌드

```bash
cd backend
npm install --production
npm run build
```

### 2. 환경변수 설정

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_PASSWORD=strong-password
JWT_SECRET=generated-secure-secret
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=info
REDIS_URL=redis://your-redis:6379
```

### 3. 실행

**PM2 사용 (권장):**

```bash
npm install -g pm2

pm2 start dist/main.js --name ggs-backend
pm2 save
pm2 startup
```

**Docker 사용:**

```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

```bash
docker build -t ggs-backend .
docker run -d -p 3000:3000 --env-file .env.production ggs-backend
```

## 프론트엔드 배포

### 1. 프로덕션 빌드

```bash
cd frontend

# .env.production 생성
echo "VITE_API_BASE_URL=https://api.your-domain.com" > .env.production

npm run build
```

빌드 결과: `dist/` 폴더

### 2. 정적 파일 서빙

**Nginx 설정:**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /var/www/ggs-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Vercel / Netlify:**

간단한 배포:

```bash
npm install -g vercel
vercel --prod
```

## 데이터베이스 배포

### PostgreSQL 설정

```bash
# PostgreSQL 설치 (Ubuntu)
sudo apt update
sudo apt install postgresql postgresql-contrib

# 데이터베이스 생성
sudo -u postgres psql
CREATE DATABASE ggs_helper;
CREATE USER ggs_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE ggs_helper TO ggs_user;
```

### 마이그레이션

```bash
# TypeORM 마이그레이션 생성
npm run typeorm migration:generate -- -n InitialSchema

# 마이그레이션 실행
npm run typeorm migration:run
```

## Redis 설정

```bash
# Redis 설치 (Ubuntu)
sudo apt install redis-server

# Redis 시작
sudo systemctl start redis
sudo systemctl enable redis

# 연결 테스트
redis-cli ping  # PONG 응답
```

## HTTPS 설정

### Let's Encrypt (무료)

```bash
# Certbot 설치
sudo apt install certbot python3-certbot-nginx

# SSL 인증서 발급
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

## 모니터링

### PM2 모니터링

```bash
pm2 monit           # 실시간 모니터링
pm2 logs            # 로그 확인
pm2 status          # 상태 확인
```

### 로그 관리

```bash
# PM2 로그 로테이션
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 10
```

## 백업

자동 백업 설정:

```bash
# cron 작업 등록
crontab -e

# 매일 새벽 3시 백업
0 3 * * * /path/to/backup-script.sh
```

**backup-script.sh:**

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U ggs_user ggs_helper > /backups/ggs_helper_$DATE.sql
find /backups -mtime +30 -delete  # 30일 이상 된 백업 삭제
```

## 성능 최적화

### Nginx Gzip

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 데이터베이스 인덱스

```sql
CREATE INDEX idx_reservation_room_time
ON reservation(room_id, reservation_starttime, reservation_endtime);

CREATE INDEX idx_reservation_status
ON reservation(reservation_status);
```

## 문제 해결

### 백엔드 재시작

```bash
pm2 restart ggs-backend
```

### 로그 확인

```bash
pm2 logs ggs-backend --lines 100
```

### 데이터베이스 연결 확인

```bash
psql -h your-db-host -U ggs_user -d ggs_helper -c "SELECT 1;"
```

## 다음 단계

- [문제 해결 가이드](./troubleshooting.md)
- [백업 및 복원](../maintenance/backup.md)
- [모니터링](../maintenance/monitoring.md)
