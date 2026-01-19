# 보안 취약점 보고서

**작성일**: 2026-01-08
**심각도**: 🔴 Critical
**상태**: 발견됨 - 수정 필요

---

## Executive Summary

로그아웃 후 자동으로 일반 권한 계정으로 로그인되는 버그를 조사한 결과, **3개의 Critical 보안 취약점**을 발견했습니다. 이는 세션 하이재킹, 권한 상승, 인증 우회로 이어질 수 있는 심각한 문제입니다.

---

## 발견된 취약점

### 🔴 CVE-001: 백엔드 로그아웃 함수 미구현

**파일**: `backend/src/auth/auth.service.ts:18-20`

**문제**:
```typescript
async logout(userId: number): Promise<void> {
  // Logout logic (if needed, e.g., token blacklist)
}
```

- 로그아웃 API가 호출되어도 **아무 동작도 하지 않음**
- JWT 토큰이 서버 측에서 무효화되지 않음
- 도난당한 토큰이 만료될 때까지 계속 사용 가능

**영향**:
- 🔴 토큰 탈취 시 로그아웃 후에도 계속 사용 가능
- 🔴 공용 컴퓨터에서 로그아웃해도 이전 세션이 유효함
- 🔴 토큰 만료 전까지 무단 접근 가능

**공격 시나리오**:
1. 공격자가 XSS나 네트워크 스니핑으로 JWT 토큰 탈취
2. 피해자가 로그아웃
3. 공격자는 여전히 탈취한 토큰으로 API 접근 가능 (만료될 때까지)

**권장 조치**:
- Redis 등을 이용한 토큰 블랙리스트 구현
- 또는 토큰에 JTI(JWT ID)를 포함하고 DB에서 관리

---

### 🔴 CVE-002: 프론트엔드 로그아웃 후 리다이렉트 없음

**파일**: `frontend/src/contexts/AuthContext.tsx:189-215`

**문제**:
```typescript
const logout = async () => {
  // ... API 호출 ...

  // 로컬 스토리지 정리
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userId');

  setAuthState({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  });
  // 리다이렉트 없음! ← 문제
};
```

- 로그아웃 후 **페이지 리다이렉트가 없음**
- 사용자가 현재 페이지에 그대로 머물러 있음
- 보호된 페이지에서 로그아웃해도 컴포넌트가 언마운트되지 않을 수 있음

**영향**:
- 🟠 사용자가 로그아웃했는지 명확하지 않음 (UX 문제)
- 🟠 캐시된 민감 정보가 화면에 남아있을 수 있음
- 🟠 React 상태와 localStorage 불일치 가능성

**권장 조치**:
```typescript
// 로그아웃 후 강제 리다이렉트 추가
window.location.href = '/login';
```

---

### 🔴 CVE-003: sessionStorage 미정리

**파일**: `frontend/src/contexts/AuthContext.tsx:189-215`

**문제**:
- `localStorage`만 정리하고 **sessionStorage는 정리하지 않음**
- 다른 컴포넌트에서 sessionStorage에 민감 정보를 저장했을 가능성

**영향**:
- 🟡 세션 데이터가 로그아웃 후에도 남아있을 수 있음
- 🟡 다음 로그인 시 이전 사용자 데이터 유출 가능

**권장 조치**:
```typescript
localStorage.clear();  // 또는 모든 키 개별 삭제
sessionStorage.clear();
```

---

### 🟠 CVE-004: 다수의 직접 localStorage 접근

**파일**: 52개 위치에서 `localStorage.getItem('accessToken')` 직접 호출

**문제**:
- AuthContext를 사용하지 않고 **여러 컴포넌트에서 직접 localStorage 접근**
- 토큰 갱신, 만료 처리 등의 로직이 중복되거나 누락될 수 있음
- 인증 로직이 분산되어 유지보수 어려움

**영향**:
- 🟡 일관되지 않은 인증 처리
- 🟡 토큰 갱신 실패 시 일부 컴포넌트가 401 에러 발생
- 🟡 보안 패치 적용 시 모든 파일 수정 필요

**권장 조치**:
- API 호출을 위한 axios 인터셉터 또는 fetch wrapper 생성
- 모든 인증 로직을 AuthContext로 중앙화

---

## 추가 발견 사항

### ⚠️ RefreshToken 미구현

**파일**: `frontend/src/contexts/AuthContext.tsx:108-155`

**문제**:
- `handleRefreshToken()` 함수가 구현되어 있음
- 하지만 백엔드에 `/auth/refresh` 엔드포인트가 **존재하지 않음**
- RefreshToken이 login 응답에 포함되지 않음

**영향**:
- Access Token 만료 시 자동 갱신 불가
- 사용자가 매번 수동으로 재로그인해야 함

---

### ⚠️ JWT 토큰 만료 시간 불명확

**파일**: `backend/src/auth/auth.service.ts:77-78`

```typescript
const payload = { userId: user.userId, role: user.role };
const accessToken = this.jwtService.sign(payload);
```

- `expiresIn` 옵션이 명시되지 않음
- JWT 모듈 설정에서 기본값 사용 중으로 추정
- 만료 시간이 너무 길거나 짧을 수 있음

**권장 조치**:
```typescript
const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
```

---

## 근본 원인 분석

### 1. 로그아웃 후 자동 로그인 버그의 원인

**시나리오 재구성**:

1. **사용자 A (admin)로 로그인**
   ```typescript
   localStorage.setItem('accessToken', 'admin_token');
   localStorage.setItem('userId', '1');
   setAuthState({ user: admin_user, isAuthenticated: true });
   ```

2. **로그아웃 버튼 클릭**
   ```typescript
   // 백엔드 API 호출 (하지만 아무것도 안함)
   await fetch('/auth/logout', ...);

   // 프론트엔드 정리
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   localStorage.removeItem('userId');
   setAuthState({ user: null, isAuthenticated: false });
   ```

3. **하지만 페이지는 그대로**
   - 리다이렉트 없음
   - 사용자는 여전히 admin 페이지에 있음
   - React 상태만 초기화되었을 뿐

4. **가능한 버그 발생 경로**:

   **경로 A: 브라우저 새로고침**
   ```typescript
   // useEffect 재실행
   const checkAuth = async () => {
     const accessToken = localStorage.getItem('accessToken'); // null
     if (accessToken) { // false
       // 실행 안됨
     } else {
       setAuthState({ user: null, isAuthenticated: false });
     }
   };
   ```
   → 이 경우는 정상적으로 로그아웃 상태 유지

   **경로 B: localStorage가 완전히 정리되지 않음**
   - 다른 탭이나 창에서 로그인 상태가 남아있음
   - 또는 localStorage.removeItem() 실패 (드물지만 가능)
   - Storage 이벤트로 인해 다른 탭의 토큰이 복사됨

   **경로 C: 컴포넌트 상태 불일치**
   - 일부 컴포넌트가 이전 인증 상태를 캐시하고 있음
   - useEffect dependency가 제대로 설정되지 않음

**가장 가능성 높은 원인**:
- 로그아웃 후 보호된 페이지에 그대로 남아있음
- React Router의 ProtectedRoute가 상태 변경을 즉시 감지하지 못함
- 또는 로그아웃 직후 다른 API가 401 응답을 받고 이상한 상태로 진입

---

## 수정 계획

### Phase 1: 긴급 수정 (즉시 적용)

1. **AuthContext logout 함수 개선**
   - localStorage.clear() 추가
   - sessionStorage.clear() 추가
   - window.location.href = '/login' 강제 리다이렉트

2. **로그 추가**
   - 로그아웃 전/후 localStorage 내용 출력
   - checkAuth 실행 시 토큰 존재 여부 로그

### Phase 2: 단기 수정 (1-2일 내)

3. **백엔드 logout 함수 구현**
   - 토큰 블랙리스트 (Redis) 또는 DB 기반 세션 관리
   - 로그아웃 시 해당 토큰 무효화

4. **Axios/Fetch 인터셉터 생성**
   - 중앙화된 API 호출 로직
   - 자동 토큰 추가 및 갱신 처리

### Phase 3: 장기 개선 (1주일 내)

5. **RefreshToken 시스템 완성**
   - 백엔드 /auth/refresh 엔드포인트 구현
   - Access Token 만료 시 자동 갱신
   - Refresh Token rotation 구현

6. **JWT 설정 최적화**
   - Access Token: 15분
   - Refresh Token: 7일
   - 만료 시간 명시적 설정

---

## 테스트 체크리스트

- [ ] admin으로 로그인 → 로그아웃 → localStorage 완전히 비어있는지 확인
- [ ] 로그아웃 후 /login 페이지로 리다이렉트되는지 확인
- [ ] 로그아웃 후 브라우저 뒤로가기 시 접근 차단되는지 확인
- [ ] 다중 탭에서 한 탭 로그아웃 시 다른 탭도 로그아웃되는지 확인
- [ ] 토큰 탈취 시나리오 테스트 (DevTools로 토큰 복사 후 로그아웃)

---

## 참고 자료

- [OWASP A07:2021 - Identification and Authentication Failures](https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/)
- [JWT Best Practices RFC 8725](https://datatracker.ietf.org/doc/html/rfc8725)
- [Token Revocation Strategies](https://fusionauth.io/articles/tokens/revoking-jwts)

---

**검토자**: Security Audit Team
**다음 검토일**: 수정 완료 후 재검증 필요
