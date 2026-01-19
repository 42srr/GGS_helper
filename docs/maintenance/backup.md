# 백업 및 복원

GGS Helper의 데이터 백업 및 복원 전략을 설명합니다.

## 백업 전략

### 백업 주기

- **일일 백업**: 매일 새벽 3시 자동 실행
- **주간 백업**: 매주 일요일 전체 백업
- **보관 기간**: 30일 (설정 가능)

## 데이터베이스 백업

### 수동 백업

```bash
# PostgreSQL 백업
docker-compose exec -T postgres pg_dump -U postgres ggs_helper > backup_$(date +%Y%m%d).sql

# 압축 백업
docker-compose exec -T postgres pg_dump -U postgres ggs_helper | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 자동 백업 스크립트

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="ggs_helper_$DATE.sql"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# PostgreSQL 백업
docker-compose exec -T postgres pg_dump -U postgres ggs_helper > $BACKUP_DIR/$FILENAME

# 압축
gzip $BACKUP_DIR/$FILENAME

# 30일 이상 된 백업 삭제
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/$FILENAME.gz"
```

### Cron 작업 등록

```bash
crontab -e

# 매일 새벽 3시 백업
0 3 * * * /path/to/backup.sh >> /var/log/ggs-backup.log 2>&1
```

## 파일 백업

### 업로드 파일

```bash
# uploads 폴더 백업
tar -czf uploads_$(date +%Y%m%d).tar.gz backend/uploads/
```

### 전체 프로젝트

```bash
# Git 커밋되지 않은 변경사항 포함
tar -czf ggs_helper_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  GGS_helper/
```

## 데이터베이스 복원

### 전체 복원

```bash
# 압축 해제 후 복원
gunzip backup_20240120.sql.gz
cat backup_20240120.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper

# 또는 한 번에
gunzip -c backup_20240120.sql.gz | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

### 데이터베이스 재생성 후 복원

```bash
# 1. 기존 DB 삭제
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS ggs_helper;"

# 2. 새 DB 생성
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE ggs_helper;"

# 3. 백업 복원
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

## 백업 검증

### 백업 파일 확인

```bash
# 파일 크기 확인
ls -lh backup_20240120.sql.gz

# 압축 해제 테스트
gunzip -t backup_20240120.sql.gz

# SQL 파일 유효성 검사
cat backup.sql | head -50
```

### 테스트 복원

```bash
# 테스트 DB에 복원
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE ggs_helper_test;"
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper_test

# 데이터 확인
docker-compose exec postgres psql -U postgres -d ggs_helper_test -c "SELECT COUNT(*) FROM reservation;"

# 테스트 DB 삭제
docker-compose exec postgres psql -U postgres -c "DROP DATABASE ggs_helper_test;"
```

## 클라우드 백업

### AWS S3

```bash
#!/bin/bash
# backup-to-s3.sh

BACKUP_FILE="ggs_helper_$(date +%Y%m%d).sql.gz"
S3_BUCKET="s3://your-bucket/ggs-backups/"

# 로컬 백업
docker-compose exec -T postgres pg_dump -U postgres ggs_helper | gzip > $BACKUP_FILE

# S3 업로드
aws s3 cp $BACKUP_FILE $S3_BUCKET

# 로컬 파일 삭제
rm $BACKUP_FILE
```

## 재해 복구 계획

### RTO/RPO 목표

- **RTO** (Recovery Time Objective): 4시간
- **RPO** (Recovery Point Objective): 24시간

### 복구 절차

1. **백업 파일 확인**
   ```bash
   ls -lh /backups/*.sql.gz
   ```

2. **최신 백업 선택**
   ```bash
   LATEST_BACKUP=$(ls -t /backups/*.sql.gz | head -1)
   ```

3. **데이터베이스 복원**
   ```bash
   gunzip -c $LATEST_BACKUP | docker-compose exec -T postgres psql -U postgres -d ggs_helper
   ```

4. **서비스 재시작**
   ```bash
   pm2 restart ggs-backend
   ```

5. **검증**
   ```bash
   curl http://localhost:6112/health
   ```

## 백업 모니터링

### 백업 성공 확인

```bash
#!/bin/bash
# check-backup.sh

BACKUP_DIR="/path/to/backups"
TODAY=$(date +%Y%m%d)
BACKUP_FILE=$(ls $BACKUP_DIR | grep $TODAY)

if [ -z "$BACKUP_FILE" ]; then
  echo "ERROR: No backup found for today"
  # 알림 전송 (이메일, Slack 등)
  exit 1
else
  echo "OK: Backup found: $BACKUP_FILE"
  exit 0
fi
```

### Cron 작업

```bash
# 매일 오전 9시 백업 확인
0 9 * * * /path/to/check-backup.sh
```

## 다음 단계

- [모니터링](./monitoring.md)
- [업데이트](./updates.md)
- [문제 해결](../deployment/troubleshooting.md)
