# 보안 점검 계획

## 발견된 이슈

### 1. 로그아웃 후 자동 로그인 문제
- **증상**: 관리자 계정 로그아웃 후 자동으로 일반 권한 계정으로 로그인됨
- **추정 원인**: JWT 토큰 관리 오류, localStorage 정리 미흡
- **위험도**: 🔴 높음 (권한 상승/세션 하이재킹 가능성)

---

## 보안 점검 항목

### Phase 1: 인증/인가 시스템 점검 (최우선)

#### 1.1 JWT 토큰 관리
- [ ] **토큰 저장소 검증**
  - localStorage에 저장되는 토큰 확인 (accessToken, refreshToken, userId)
  - 로그아웃 시 모든 토큰이 제대로 삭제되는지 확인
  - 브라우저 개발자 도구 Application 탭에서 실제 저장된 데이터 확인

- [ ] **토큰 생명주기 관리**
  - Access Token 만료 시간 확인
  - Refresh Token 존재 여부 및 갱신 로직 검증
  - 토큰 갱신 시 이전 토큰 무효화 확인

- [ ] **토큰 검증 로직**
  - JWT 서명 검증 (backend/src/auth/strategies/jwt.strategy.ts)
  - 토큰 페이로드 검증 (userId, role 정확성)
  - 만료된 토큰 처리 로직

#### 1.2 세션 관리
- [ ] **로그아웃 처리**
  - 프론트엔드: AuthContext.logout() 함수 검증
  - 백엔드: /auth/logout API 동작 확인
  - 서버 측 토큰 블랙리스트/무효화 메커니즘 확인

- [ ] **자동 로그인 로직**
  - AuthContext useEffect의 checkAuth() 함수 분석
  - 페이지 새로고침 시 토큰 재검증 로직
  - /auth/me API 응답 확인

- [ ] **다중 계정 처리**
  - 동일 브라우저에서 여러 계정 로그인 시나리오
  - 계정 전환 시 이전 세션 정리 확인

#### 1.3 권한 관리
- [ ] **Role-Based Access Control (RBAC)**
  - RolesGuard 동작 검증 (backend/src/auth/guards/roles.guard.ts)
  - PERMISSIONS 매핑 정확성 (backend/src/auth/enums/role.enum.ts)
  - 와일드카드 권한 처리 로직 재검증

- [ ] **권한 상승 방지**
  - 일반 사용자가 관리자 API에 접근 시도 시 차단 확인
  - JWT 페이로드 조작 시도 테스트
  - Role 변경 API 권한 확인 (admin만 가능해야 함)

---

### Phase 2: 데이터 보안 점검

#### 2.1 비밀번호 보안
- [ ] **해싱 알고리즘**
  - bcrypt 라운드 수 확인 (현재 10 rounds)
  - Salt 자동 생성 확인
  - 비밀번호 저장 전 해싱 보장

- [ ] **비밀번호 정책**
  - 최소 길이, 복잡도 요구사항 확인
  - 비밀번호 변경 시 현재 비밀번호 확인
  - 비밀번호 재설정 프로세스 보안

#### 2.2 민감 데이터 노출
- [ ] **API 응답 검증**
  - 사용자 정보 API에서 비밀번호 해시 노출 여부
  - 에러 메시지에 민감 정보 포함 여부
  - 로그에 토큰/비밀번호 출력 여부

- [ ] **환경 변수 관리**
  - .env 파일이 .gitignore에 포함되었는지 확인
  - JWT_SECRET 강도 확인
  - DATABASE_PASSWORD 노출 여부

---

### Phase 3: API 보안 점검

#### 3.1 인증 우회 방지
- [ ] **Guard 적용 확인**
  - 모든 보호된 엔드포인트에 JwtAuthGuard 적용 확인
  - Public 엔드포인트 목록 검토 (최소화)
  - Guard 순서 확인 (JwtAuthGuard → RolesGuard)

- [ ] **CORS 설정**
  - 허용된 Origin 확인
  - 프로덕션 환경에서 와일드카드(*) 사용 금지
  - Credentials 허용 설정 검토

#### 3.2 입력 검증
- [ ] **DTO Validation**
  - class-validator 사용 확인
  - 모든 입력 필드 검증 (username, password, email 등)
  - SQL Injection 방지 (TypeORM Parameterized Query 사용)

- [ ] **XSS 방지**
  - 사용자 입력 sanitization
  - Content-Security-Policy 헤더 설정
  - HTML 이스케이프 처리

---

### Phase 4: 코드 레벨 점검

#### 4.1 주요 파일 검토 대상

**프론트엔드**
- [ ] `frontend/src/contexts/AuthContext.tsx` - 인증 로직 핵심
- [ ] `frontend/src/pages/LoginPage.tsx` - 로그인 플로우
- [ ] `frontend/src/App.tsx` - 라우팅 보호
- [ ] localStorage 사용 위치 전체 검색

**백엔드**
- [ ] `backend/src/auth/auth.service.ts` - 인증 비즈니스 로직
- [ ] `backend/src/auth/auth.controller.ts` - 인증 엔드포인트
- [ ] `backend/src/auth/strategies/jwt.strategy.ts` - JWT 검증
- [ ] `backend/src/auth/guards/jwt-auth.guard.ts` - 인증 가드
- [ ] `backend/src/auth/guards/roles.guard.ts` - 권한 가드

#### 4.2 디버깅 전략
1. **프론트엔드 로그 추가**
   - AuthContext의 모든 상태 변경에 console.log 추가
   - login(), logout(), checkAuth() 함수 진입/종료 로그
   - localStorage 변경 이벤트 감지

2. **백엔드 로그 추가**
   - /auth/login, /auth/logout, /auth/me API 호출 로그
   - JWT 검증 성공/실패 로그
   - RolesGuard 권한 체크 로그

3. **브라우저 개발자 도구 활용**
   - Network 탭에서 API 요청/응답 확인
   - Application 탭에서 localStorage 실시간 모니터링
   - Console에서 에러 메시지 확인

---

## 즉시 수행할 긴급 조치

### 🔥 Critical - 즉시 수행

1. **로그아웃 로직 강화**
   ```typescript
   // AuthContext.tsx logout 함수 개선
   const logout = async () => {
     try {
       // 1. 서버에 로그아웃 요청
       await fetch(`${API_BASE_URL}/auth/logout`, {
         method: 'POST',
         headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
       });
     } catch (error) {
       console.error('Logout API failed:', error);
     } finally {
       // 2. 모든 로컬 데이터 강제 삭제
       localStorage.clear(); // 또는 removeItem을 각각 호출
       sessionStorage.clear();

       // 3. 상태 초기화
       setAuthState({
         user: null,
         isAuthenticated: false,
         isLoading: false
       });

       // 4. 로그인 페이지로 리다이렉트
       window.location.href = '/login';
     }
   };
   ```

2. **JWT 토큰 페이로드 검증**
   ```typescript
   // 토큰 디코딩하여 userId와 role 확인
   const decodedToken = jwtDecode(accessToken);
   console.log('Token payload:', decodedToken);
   // userId, role이 예상과 일치하는지 확인
   ```

3. **백엔드 로그아웃 API 개선**
   - 토큰 블랙리스트 구현 고려
   - RefreshToken 무효화 처리

---

## 테스트 시나리오

### 시나리오 1: 정상 로그아웃
1. admin 계정으로 로그인
2. 로그아웃 버튼 클릭
3. **예상 결과**: 로그인 페이지로 이동, localStorage 비어있음
4. **확인 사항**: 자동으로 다른 계정 로그인되지 않음

### 시나리오 2: 토큰 만료
1. 로그인 후 access token 만료까지 대기
2. API 요청 시도
3. **예상 결과**: 401 응답, 로그인 페이지로 리다이렉트
4. **확인 사항**: refresh token 있으면 자동 갱신

### 시나리오 3: 권한 테스트
1. student 계정으로 로그인
2. /admin/* 경로 접근 시도
3. **예상 결과**: 403 Forbidden
4. **확인 사항**: 에러 메시지에 민감 정보 없음

### 시나리오 4: 다중 탭 테스트
1. 탭 A에서 로그인
2. 탭 B 열기
3. 탭 A에서 로그아웃
4. **예상 결과**: 탭 B도 로그아웃 상태로 변경

---

## 체크리스트 요약

### High Priority (P0)
- [ ] 로그아웃 시 localStorage 완전 삭제 확인
- [ ] AuthContext checkAuth() 로직 검증
- [ ] JWT 토큰 페이로드에 올바른 userId, role 포함 확인
- [ ] /auth/me API 응답 데이터 확인

### Medium Priority (P1)
- [ ] RolesGuard 와일드카드 권한 로직 재검증
- [ ] 모든 protected route에 Guard 적용 확인
- [ ] 에러 핸들링 및 로그 추가

### Low Priority (P2)
- [ ] 비밀번호 정책 강화
- [ ] CORS 설정 재검토
- [ ] 토큰 갱신 로직 개선

---

## 참고 자료

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/authentication)

---

**작성일**: 2026-01-08
**작성자**: Security Audit
**문서 버전**: 1.0
