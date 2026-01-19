# 보안 기능

GGS Helper의 보안 정책과 구현을 설명합니다.

## 보안 계층

### 1. 네트워크 보안

**CORS 설정:**
```typescript
// main.ts
app.enableCors({
  origin: process.env.CORS_ORIGIN, // http://localhost:6111
  credentials: true,
});
```

**Rate Limiting:**
- 전역: 60초당 100 요청
- 회원가입: 1시간당 3회
- 로그인: 60초당 5회
- 예약 생성: 60초당 20회

### 2. 인증 보안

**JWT 토큰:**
- HS256 알고리즘
- 만료 시간: 1일 (설정 가능)
- Secret Key: 환경변수로 관리

**Token Blacklist:**
- 로그아웃 시 토큰 블랙리스트 추가
- 개발: In-memory Set
- 프로덕션: Redis 권장

### 3. 비밀번호 보안

**bcrypt 해싱:**
- Salt rounds: 10
- 평문 비밀번호는 DB에 저장 안 됨
- 비밀번호 필드는 `select: false`

**복잡도 요구사항:**
- 최소 8자
- 대문자 1개 이상
- 소문자 1개 이상
- 숫자 1개 이상

### 4. 데이터 보안

**SQL Injection 방지:**
- TypeORM 파라미터화된 쿼리 사용
- 사용자 입력 직접 쿼리에 사용 금지

**XSS 방지:**
- DTO validation
- HTML escape (프론트엔드)

**민감 정보 보호:**
- 비밀번호는 응답에 포함 안 됨
- JWT Secret은 환경변수로 관리
- `.env` 파일은 .gitignore

## 입력 검증

### DTO Validators

```typescript
import { IsString, IsEmail, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @Matches(/^[a-zA-Z0-9_-]+$/)
  username: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  password: string;
}
```

### 파일 업로드 검증

```typescript
// multer.config.ts
export const multerConfig = {
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, JPEG, PNG allowed'), false);
    }
  },
};
```

## Rate Limiting 정책

| 엔드포인트 | 제한 | 사유 |
|----------|------|------|
| `POST /auth/register` | 3회/1시간 | 스팸 계정 방지 |
| `POST /auth/login` | 5회/60초 | Brute force 방지 |
| `POST /reservations` | 20회/60초 | 스팸 예약 방지 |
| `POST /reservations/check-conflict` | 60회/60초 | 실시간 체크 허용 |
| 기타 | 100회/60초 | 일반 제한 |

## 보안 체크리스트

### 구현 완료

- [x] JWT 인증
- [x] bcrypt 비밀번호 해싱
- [x] Token Blacklist
- [x] Rate Limiting
- [x] DTO Validation
- [x] RBAC (Role-based Access Control)
- [x] CORS 설정
- [x] SQL Injection 방지 (TypeORM)
- [x] 파일 업로드 검증

### 프로덕션 권장

- [ ] HTTPS 강제
- [ ] Helmet.js (보안 헤더)
- [ ] Redis Token Blacklist
- [ ] 로그 모니터링
- [ ] 침입 탐지 시스템
- [ ] 정기 보안 감사

## 환경변수 관리

**절대 공개 금지:**
- `JWT_SECRET`
- `DATABASE_PASSWORD`
- `REDIS_PASSWORD`

**.gitignore 필수:**
```
.env
.env.local
.env.production
```

**프로덕션 배포 시:**
- AWS Secrets Manager
- Azure Key Vault
- Docker Secrets

## 보안 모니터링

### 로그 기록

```typescript
// activity-log.entity.ts
@Entity('activity_log')
export class ActivityLog {
  @Column() action: string;
  @Column() userId: number;
  @Column() targetType: string;
  @Column() targetId: number;
  @CreateDateColumn() createdAt: Date;
}
```

### 모니터링 항목

- 로그인 실패 횟수
- Rate limit 초과
- 권한 없는 접근 시도
- 의심스러운 활동

## 다음 단계

- [인증/인가](./authentication.md)
- [배포 가이드](../deployment/production.md)
