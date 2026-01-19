# 업데이트 가이드

GGS Helper의 업데이트 및 유지보수 절차를 설명합니다.

## 업데이트 전 준비

### 백업

```bash
# 1. 데이터베이스 백업
docker-compose exec -T postgres pg_dump -U postgres ggs_helper > backup_before_update.sql

# 2. 업로드 파일 백업
tar -czf uploads_backup.tar.gz backend/uploads/

# 3. 환경변수 백업
cp backend/.env backend/.env.backup
cp frontend/.env frontend/.env.backup
```

### 현재 버전 확인

```bash
# package.json 버전
cat backend/package.json | grep version
cat frontend/package.json | grep version

# Git 커밋
git log -1 --oneline
```

## 의존성 업데이트

### 백엔드

```bash
cd backend

# 업데이트 가능한 패키지 확인
npm outdated

# 패키지 업데이트
npm update

# 주요 버전 업데이트 (주의)
npm install @nestjs/core@latest
npm install typeorm@latest
```

### 프론트엔드

```bash
cd frontend

# 업데이트 확인
npm outdated

# 패키지 업데이트
npm update

# React 업데이트
npm install react@latest react-dom@latest
```

## 애플리케이션 업데이트

### Git Pull

```bash
# 변경사항 확인
git status

# 최신 코드 가져오기
git pull origin main

# 변경된 파일 확인
git diff HEAD@{1} HEAD
```

### 빌드 및 재시작

**백엔드:**

```bash
cd backend
npm install
npm run build
pm2 restart ggs-backend
```

**프론트엔드:**

```bash
cd frontend
npm install
npm run build

# 정적 파일 배포
cp -r dist/* /var/www/ggs-frontend/
```

## 데이터베이스 마이그레이션

### TypeORM 마이그레이션

```bash
# 마이그레이션 파일 생성
npm run typeorm migration:generate -- -n UpdateName

# 마이그레이션 실행
npm run typeorm migration:run

# 롤백 (필요시)
npm run typeorm migration:revert
```

### 수동 스키마 변경

```sql
-- 새 컬럼 추가 예시
ALTER TABLE reservation
ADD COLUMN new_field VARCHAR(255);

-- 인덱스 추가
CREATE INDEX idx_new_field ON reservation(new_field);
```

## 설정 업데이트

### 환경변수 변경

```bash
# 백엔드 환경변수 수정
nano backend/.env

# 프론트엔드 환경변수 수정
nano frontend/.env

# 서비스 재시작
pm2 restart ggs-backend
```

### Nginx 설정

```bash
# 설정 수정
sudo nano /etc/nginx/sites-available/ggs-helper

# 설정 테스트
sudo nginx -t

# 재시작
sudo systemctl reload nginx
```

## 보안 패치

### npm Audit

```bash
# 취약점 확인
npm audit

# 자동 수정
npm audit fix

# 주요 버전 업데이트 필요 시
npm audit fix --force
```

### 비밀키 교체

```bash
# 새 JWT Secret 생성
openssl rand -base64 32

# .env 업데이트
JWT_SECRET=new-secret-key

# 서비스 재시작 (기존 토큰 무효화)
pm2 restart ggs-backend
```

## 롤백 절차

### 코드 롤백

```bash
# 이전 커밋으로 롤백
git log --oneline
git checkout <commit-hash>

# 빌드 및 재시작
npm install
npm run build
pm2 restart ggs-backend
```

### 데이터베이스 롤백

```bash
# 백업 복원
cat backup_before_update.sql | docker-compose exec -T postgres psql -U postgres -d ggs_helper
```

### 마이그레이션 롤백

```bash
# TypeORM 마이그레이션 되돌리기
npm run typeorm migration:revert
```

## 테스트

### 업데이트 후 검증

```bash
# 1. 헬스 체크
curl http://localhost:6112/health

# 2. 로그인 테스트
curl -X POST http://localhost:6112/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin1234!"}'

# 3. API 테스트
curl http://localhost:6112/reservations \
  -H "Authorization: Bearer <token>"

# 4. 프론트엔드 접속
# 브라우저에서 http://localhost:6111
```

### 모니터링

```bash
# PM2 상태
pm2 status

# 로그 확인
pm2 logs ggs-backend --lines 50

# 에러 확인
pm2 logs ggs-backend --err
```

## 버전 관리

### Semantic Versioning

```
MAJOR.MINOR.PATCH

예: 1.2.3
- MAJOR: 호환되지 않는 변경
- MINOR: 새로운 기능 추가
- PATCH: 버그 수정
```

### 태그 생성

```bash
# 버전 태그 생성
git tag -a v1.2.0 -m "Release version 1.2.0"

# 태그 푸시
git push origin v1.2.0

# 태그 목록
git tag -l
```

## 정기 유지보수

### 주간

- [ ] 로그 확인
- [ ] 디스크 사용량 확인
- [ ] 백업 검증

### 월간

- [ ] 의존성 업데이트 검토
- [ ] 보안 취약점 스캔
- [ ] 성능 모니터링 리뷰
- [ ] 데이터베이스 최적화

### 분기별

- [ ] 주요 업데이트 계획
- [ ] 재해 복구 테스트
- [ ] 용량 계획 검토

## 다음 단계

- [백업 및 복원](./backup.md)
- [모니터링](./monitoring.md)
- [문제 해결](../deployment/troubleshooting.md)
