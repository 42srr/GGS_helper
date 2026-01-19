# Google OAuth 로그인 구현 계획서

## 1. 개요

### 목적
- 기존 로컬 인증(username/password) 방식을 Google OAuth 2.0으로 전환
- 사용자 편의성 향상 및 보안 강화
- 회원가입 절차 간소화

### 배경
- 현재 시스템은 JWT 기반 로컬 인증을 사용
- 사용자가 직접 비밀번호를 관리해야 하는 부담
- Google 계정을 통한 간편 로그인으로 사용자 경험 개선

## 2. 현재 시스템 분석

### 백엔드 (NestJS)
- **인증 방식**: JWT 토큰 기반 (만료: 7일)
- **사용자 엔티티**:
  - `userId`, `username`, `email`, `password` (bcrypt 해시), `name`, `phone`
  - `role` (STUDENT, STAFF, ADMIN)
  - `isAvailable` (활성화 상태)
- **인증 엔드포인트**:
  - `POST /auth/register` - 회원가입
  - `POST /auth/login` - 로그인 (JWT 발급)
  - `POST /auth/logout` - 로그아웃 (토큰 블랙리스트)
  - `GET /auth/me` - 현재 사용자 정보
- **보안 기능**:
  - JWT 전략 (`jwt.strategy.ts`)
  - JWT 가드 (`jwt-auth.guard.ts`)
  - 토큰 블랙리스트 (로그아웃 시)
  - RBAC (역할 기반 접근 제어)
  - PBAC (권한 기반 접근 제어)

### 프론트엔드 (React)
- **인증 상태 관리**: Context API (`AuthContext.tsx`)
- **로그인 페이지**: 사용자명/비밀번호 입력 폼
- **회원가입 페이지**: 이메일, 사용자명, 이름, 비밀번호, 비밀번호 확인
- **토큰 저장**: localStorage (`accessToken`, `refreshToken`, `userId`)
- **보호된 라우트**: ProtectedRoute 컴포넌트

### 이전 OAuth 통합 이력
- 42 School OAuth가 이전에 구현되었으나 제거됨
- 마이그레이션: `1736316000000-Remove42Integration.ts`
- 제거된 필드: `intraid`, `profileimgurl`, `refreshtoken`, `grade`

## 3. 구현 계획

### 3.1 백엔드 변경사항

#### 3.1.1 패키지 설치
```bash
npm install @nestjs/passport passport passport-google-oauth20
npm install -D @types/passport-google-oauth20
```

#### 3.1.2 User 엔티티 수정
**파일**: `backend/src/user/entities/user.entity.ts`

```typescript
// 추가할 필드:
@Column({ name: 'google_id', nullable: true, unique: true })
googleId: string;

@Column({ name: 'google_email', nullable: true })
googleEmail: string;

@Column({ name: 'google_picture', nullable: true })
googlePicture: string;

// 수정할 필드:
@Column({ name: 'user_password', nullable: true }) // nullable로 변경
password: string;

@Column({ name: 'user_username', nullable: true }) // nullable로 변경
username: string;
```

#### 3.1.3 데이터베이스 마이그레이션
**파일**: `backend/src/migrations/[timestamp]-AddGoogleOAuth.ts`

```typescript
// 1. google_id, google_email, google_picture 컬럼 추가
// 2. user_password를 nullable로 변경
// 3. user_username을 nullable로 변경
// 4. google_id에 unique 인덱스 추가
```

#### 3.1.4 Google OAuth Strategy 생성
**파일**: `backend/src/auth/strategies/google.strategy.ts`

```typescript
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName, photos } = profile;

    // 사용자 조회 또는 생성
    const user = await this.authService.validateGoogleUser({
      googleId: id,
      email: emails[0].value,
      name: displayName,
      picture: photos[0].value,
    });

    done(null, user);
  }
}
```

#### 3.1.5 Google Auth Guard 생성
**파일**: `backend/src/auth/guards/google-auth.guard.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {}
```

#### 3.1.6 Auth Service 수정
**파일**: `backend/src/auth/auth.service.ts`

```typescript
// 추가할 메서드:
async validateGoogleUser(googleData: {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}): Promise<User> {
  // 1. googleId로 기존 사용자 검색
  let user = await this.userRepository.findOne({
    where: { googleId: googleData.googleId },
  });

  if (!user) {
    // 2. 이메일로 기존 사용자 검색 (기존 로컬 계정과 연동)
    user = await this.userRepository.findOne({
      where: { email: googleData.email },
    });

    if (user) {
      // 기존 계정에 Google 정보 추가
      user.googleId = googleData.googleId;
      user.googleEmail = googleData.email;
      user.googlePicture = googleData.picture;
      await this.userRepository.save(user);
    } else {
      // 3. 새 사용자 생성
      user = this.userRepository.create({
        googleId: googleData.googleId,
        email: googleData.email,
        googleEmail: googleData.email,
        name: googleData.name,
        googlePicture: googleData.picture,
        role: 'STUDENT', // 기본 역할
        isAvailable: true,
      });
      await this.userRepository.save(user);
    }
  }

  return user;
}
```

#### 3.1.7 Auth Controller 수정
**파일**: `backend/src/auth/auth.controller.ts`

```typescript
// 추가할 엔드포인트:

@Get('google')
@UseGuards(GoogleAuthGuard)
async googleAuth() {
  // Google OAuth 로그인 페이지로 리다이렉트
}

@Get('google/callback')
@UseGuards(GoogleAuthGuard)
async googleAuthCallback(@Req() req, @Res() res: Response) {
  // Google 인증 성공 후 콜백
  const user = req.user;
  const tokens = await this.authService.login(user);

  // 프론트엔드로 리다이렉트 (토큰 포함)
  res.redirect(
    `${process.env.FRONTEND_URL}/auth/callback?token=${tokens.access_token}&refreshToken=${tokens.refresh_token}&userId=${user.userId}`
  );
}

// 유지할 엔드포인트:
// - POST /auth/logout (여전히 필요)
// - GET /auth/me (여전히 필요)

// 제거할 엔드포인트:
// - POST /auth/register (Google OAuth로 대체)
// - POST /auth/login (Google OAuth로 대체)
```

#### 3.1.8 환경변수 추가
**파일**: `backend/.env`

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/auth/google/callback
FRONTEND_URL=http://localhost:3000
```

#### 3.1.9 Auth Module 수정
**파일**: `backend/src/auth/auth.module.ts`

```typescript
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({...}),
    TypeOrmModule.forFeature([User]),
    ConfigModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy, // 추가
  ],
  controllers: [AuthController],
})
export class AuthModule {}
```

### 3.2 프론트엔드 변경사항

#### 3.2.1 LoginPage 수정
**파일**: `frontend/src/pages/LoginPage.tsx`

```typescript
// 기존 username/password 폼 제거
// Google 로그인 버튼으로 교체

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // 백엔드 Google OAuth 엔드포인트로 리다이렉트
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="login-container">
      <h1>GGS Helper 로그인</h1>
      <button
        onClick={handleGoogleLogin}
        className="google-login-button"
      >
        <img src="/google-icon.svg" alt="Google" />
        Google 계정으로 로그인
      </button>
    </div>
  );
}
```

#### 3.2.2 OAuth Callback 페이지 생성
**파일**: `frontend/src/pages/OAuthCallbackPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const userId = searchParams.get('userId');

    if (token && refreshToken && userId) {
      // 토큰 저장
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);

      // Auth Context 업데이트
      setToken(token);

      // 메인 페이지로 리다이렉트
      navigate('/');
    } else {
      // 에러 처리
      alert('로그인에 실패했습니다.');
      navigate('/login');
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p>로그인 처리 중...</p>
      </div>
    </div>
  );
}
```

#### 3.2.3 RegisterPage 제거
**파일**: `frontend/src/pages/RegisterPage.tsx`
- 삭제 예정 (Google OAuth가 자동으로 계정 생성)

#### 3.2.4 App 라우팅 수정
**파일**: `frontend/src/App.tsx`

```typescript
// 추가할 라우트:
<Route path="/auth/callback" element={<OAuthCallbackPage />} />

// 제거할 라우트:
<Route path="/register" element={<RegisterPage />} />
```

#### 3.2.5 AuthContext 수정 (선택적)
**파일**: `frontend/src/contexts/AuthContext.tsx`

```typescript
// login 메서드는 더 이상 사용하지 않지만 유지 가능 (하위 호환성)
// 또는 제거하고 setToken 메서드만 사용
```

### 3.3 Google Cloud Console 설정

#### 3.3.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

#### 3.3.2 OAuth 2.0 클라이언트 ID 생성
1. "API 및 서비스" > "사용자 인증 정보"로 이동
2. "사용자 인증 정보 만들기" > "OAuth 클라이언트 ID" 선택
3. 애플리케이션 유형: "웹 애플리케이션"
4. 승인된 리디렉션 URI 추가:
   - 개발: `http://localhost:3001/auth/google/callback`
   - 프로덕션: `https://yourdomain.com/auth/google/callback`
5. 클라이언트 ID와 시크릿 복사하여 `.env`에 저장

#### 3.3.3 OAuth 동의 화면 구성
1. "OAuth 동의 화면" 메뉴로 이동
2. 사용자 유형 선택 (내부/외부)
3. 앱 정보 입력:
   - 앱 이름: "GGS Helper"
   - 사용자 지원 이메일
   - 승인된 도메인
4. 범위 추가: `email`, `profile`

## 4. 마이그레이션 전략

### 4.1 기존 사용자 처리

**시나리오 1: 기존 로컬 계정이 있는 사용자**
- Google 로그인 시 이메일로 기존 계정 검색
- 기존 계정에 `googleId`, `googleEmail`, `googlePicture` 추가
- 다음부터는 Google 로그인만 사용 가능

**시나리오 2: 신규 사용자**
- Google 로그인 시 자동으로 계정 생성
- 기본 역할: `STUDENT`
- 관리자가 필요시 역할 변경

**시나리오 3: 이메일 불일치**
- Google 계정과 기존 계정의 이메일이 다른 경우
- 새 계정으로 생성 (관리자가 수동으로 병합 필요시 별도 처리)

### 4.2 데이터베이스 마이그레이션 순서

1. **마이그레이션 파일 생성**
   ```bash
   npm run migration:generate -- -n AddGoogleOAuth
   ```

2. **마이그레이션 실행**
   ```bash
   npm run migration:run
   ```

3. **기존 데이터 확인**
   - 모든 기존 사용자의 `password`, `username` 필드는 유지됨
   - 새로운 Google 관련 필드는 `NULL` 상태

4. **롤백 계획**
   ```bash
   npm run migration:revert
   ```

## 5. 구현 단계

### Phase 1: 백엔드 기반 구축 (1-2일)
- [ ] 패키지 설치 및 환경변수 설정
- [ ] Google Cloud Console OAuth 설정
- [ ] User 엔티티 수정
- [ ] 데이터베이스 마이그레이션 생성 및 실행
- [ ] GoogleStrategy 구현
- [ ] GoogleAuthGuard 구현

### Phase 2: 백엔드 로직 구현 (1-2일)
- [ ] AuthService에 `validateGoogleUser` 메서드 추가
- [ ] AuthController에 Google 엔드포인트 추가
- [ ] AuthModule에 GoogleStrategy 등록
- [ ] 로컬 테스트 (Postman/Thunder Client)

### Phase 3: 프론트엔드 구현 (1일)
- [ ] LoginPage 수정 (Google 로그인 버튼)
- [ ] OAuthCallbackPage 생성
- [ ] RegisterPage 제거
- [ ] App 라우팅 수정
- [ ] Google 로그인 버튼 스타일링

### Phase 4: 통합 테스트 (1일)
- [ ] 전체 흐름 테스트
  - Google 로그인 버튼 클릭
  - Google 계정 선택
  - 콜백 처리
  - 토큰 저장
  - 메인 페이지 리다이렉트
- [ ] 기존 사용자 계정 연동 테스트
- [ ] 신규 사용자 계정 생성 테스트
- [ ] 로그아웃 테스트
- [ ] 보호된 라우트 접근 테스트

### Phase 5: 정리 및 문서화 (0.5일)
- [ ] 불필요한 코드 제거 (register 관련)
- [ ] 환경변수 문서 업데이트
- [ ] README 업데이트
- [ ] 배포 가이드 작성

## 6. 테스트 계획

### 6.1 단위 테스트
- [ ] GoogleStrategy.validate() 메서드 테스트
- [ ] AuthService.validateGoogleUser() 메서드 테스트
- [ ] 기존 사용자 연동 로직 테스트
- [ ] 신규 사용자 생성 로직 테스트

### 6.2 통합 테스트
- [ ] Google OAuth 전체 플로우 테스트
- [ ] 토큰 발급 및 검증 테스트
- [ ] 로그아웃 및 토큰 블랙리스트 테스트

### 6.3 E2E 테스트
- [ ] 신규 사용자 Google 로그인
- [ ] 기존 사용자 Google 로그인 (계정 연동)
- [ ] 로그인 후 보호된 페이지 접근
- [ ] 로그아웃 후 보호된 페이지 접근 차단

### 6.4 수동 테스트 시나리오

**시나리오 1: 신규 사용자 가입**
1. "Google 계정으로 로그인" 버튼 클릭
2. Google 계정 선택
3. 권한 동의
4. 메인 페이지로 자동 리다이렉트
5. 사용자 정보 확인 (프로필 메뉴)
6. DB에 새 사용자 생성 확인

**시나리오 2: 기존 사용자 로그인**
1. 기존에 로컬 계정으로 가입된 이메일로 Google 로그인
2. 기존 계정에 Google 정보 추가 확인
3. 로그인 성공 및 기존 데이터 유지 확인

**시나리오 3: 로그아웃 및 재로그인**
1. 로그아웃 클릭
2. 로그인 페이지로 리다이렉트 확인
3. 재로그인 시 이전 토큰 블랙리스트 확인
4. 새 토큰 발급 확인

## 7. 보안 고려사항

### 7.1 OAuth 보안
- **State 매개변수**: CSRF 공격 방지를 위해 state 매개변수 사용 (passport-google-oauth20이 자동 처리)
- **HTTPS**: 프로덕션 환경에서는 반드시 HTTPS 사용
- **Client Secret 보호**: 절대 프론트엔드에 노출하지 않음 (백엔드만 사용)
- **리다이렉션 URI 검증**: Google Cloud Console에 등록된 URI만 허용

### 7.2 토큰 관리
- **JWT 만료 시간**: 기존과 동일하게 7일 유지
- **Refresh Token**: 필요시 구현 (현재는 access token만 사용)
- **토큰 블랙리스트**: 로그아웃 시 계속 사용

### 7.3 사용자 데이터 보호
- **최소 권한 요청**: `email`, `profile` 범위만 요청
- **개인정보 처리**: Google 프로필 사진 URL만 저장 (실제 이미지 저장 안 함)
- **계정 연동**: 이메일 기반으로 기존 계정 자동 연동 시 보안 검토

### 7.4 에러 처리
- OAuth 실패 시 사용자에게 명확한 에러 메시지
- 로그인 실패 로깅 (보안 감사)
- Rate limiting (무차별 대입 공격 방지)

## 8. 롤백 계획

### 8.1 롤백 시나리오
- Google OAuth 연동 실패
- 사용자 불편 사항 발생
- 보안 문제 발견

### 8.2 롤백 절차

**1단계: 백엔드 롤백**
```bash
# 마이그레이션 되돌리기
npm run migration:revert

# Google OAuth 관련 코드 제거
git revert <commit-hash>
```

**2단계: 프론트엔드 롤백**
```bash
# 이전 LoginPage 복원
git revert <commit-hash>

# RegisterPage 복원
git revert <commit-hash>
```

**3단계: 환경변수 제거**
- `.env`에서 Google OAuth 관련 변수 제거

**4단계: 서비스 재시작**
```bash
# 백엔드
npm run start:dev

# 프론트엔드
npm run dev
```

### 8.3 데이터 보존
- 롤백 시에도 `googleId`, `googleEmail`, `googlePicture` 컬럼은 유지 (nullable이므로 문제없음)
- 기존 `password`, `username` 필드는 영향 없음

## 9. 배포 가이드

### 9.1 개발 환경
- `.env` 파일에 Google OAuth 개발 설정 추가
- `localhost` 도메인으로 테스트

### 9.2 프로덕션 환경

**사전 준비**
1. Google Cloud Console에서 프로덕션 리다이렉션 URI 추가
2. 프로덕션 환경변수 설정
3. HTTPS 인증서 확인

**배포 순서**
1. 데이터베이스 마이그레이션 실행 (프로덕션 DB)
2. 백엔드 배포
3. 환경변수 적용 (Kubernetes Secret / AWS Parameter Store 등)
4. 프론트엔드 빌드 및 배포
5. DNS 및 HTTPS 설정 확인

**배포 후 확인**
- [ ] Google OAuth 로그인 테스트
- [ ] 기존 사용자 로그인 테스트
- [ ] 신규 사용자 가입 테스트
- [ ] 에러 로그 모니터링
- [ ] 성능 모니터링

## 10. 예상 이슈 및 해결 방안

### 이슈 1: 기존 사용자의 이메일과 Google 이메일 불일치
**원인**: 사용자가 가입 시와 다른 이메일로 Google 로그인
**해결**:
- 관리자 페이지에서 계정 병합 기능 제공
- 또는 사용자가 직접 계정 연동 요청

### 이슈 2: Google OAuth 서비스 다운타임
**원인**: Google 서비스 장애
**해결**:
- 사용자에게 명확한 에러 메시지
- 임시로 기존 로컬 로그인 엔드포인트 활성화 (비상용)

### 이슈 3: Callback URL 리다이렉션 실패
**원인**: 잘못된 환경변수 설정 또는 CORS 문제
**해결**:
- 환경변수 검증 스크립트 추가
- CORS 설정 확인 (`frontend URL`을 허용 목록에 추가)

### 이슈 4: 프로필 사진 로딩 실패
**원인**: Google 프로필 사진 URL 만료 또는 접근 불가
**해결**:
- 기본 프로필 이미지 제공
- 에러 발생 시 fallback 처리

## 11. 성공 기준

### 기능적 요구사항
- [x] Google 계정으로 로그인 가능
- [x] 기존 사용자 계정 자동 연동
- [x] 신규 사용자 자동 가입
- [x] 로그인 후 모든 기존 기능 정상 동작
- [x] 로그아웃 정상 동작

### 비기능적 요구사항
- [x] 로그인 프로세스 5초 이내 완료
- [x] 99% 이상의 로그인 성공률
- [x] 보안 취약점 없음 (OWASP Top 10 기준)
- [x] 모바일 브라우저 호환성

### 사용자 경험
- [x] 회원가입 절차 간소화 (1-click 로그인)
- [x] 비밀번호 관리 부담 제거
- [x] 직관적인 로그인 UI

## 12. 참고 자료

- [NestJS Passport Google Strategy](https://docs.nestjs.com/security/authentication#implementing-passport-google)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [passport-google-oauth20](https://www.passportjs.org/packages/passport-google-oauth20/)
- [Google Cloud Console](https://console.cloud.google.com/)

## 13. 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|-----------|
| 2026-01-14 | Claude | 초안 작성 |
