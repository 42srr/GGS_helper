# 보안 점검 요약 보고서

**작성일**: 2026-01-08
**점검 범위**: 인증/인가 시스템
**점검 결과**: 3개 Critical 취약점 발견 및 1개 긴급 수정 완료

---

## 1. 점검 개요

**점검 목적**: "로그아웃 후 자동으로 일반 권한 계정으로 로그인되는 버그" 조사

**점검 방법**:
- 프론트엔드 AuthContext 코드 리뷰
- localStorage 사용 패턴 분석 (52개 위치)
- 백엔드 인증 API 검증
- JWT 토큰 관리 로직 분석

---

## 2. 발견된 취약점

### 🔴 Critical: 3건

| CVE ID | 취약점 | 파일 | 상태 |
|--------|--------|------|------|
| CVE-001 | 백엔드 로그아웃 함수 미구현 | backend/src/auth/auth.service.ts:18-20 | ⏳ 미수정 |
| CVE-002 | 로그아웃 후 리다이렉트 없음 | frontend/src/contexts/AuthContext.tsx:189-215 | ✅ 수정 완료 |
| CVE-003 | sessionStorage 미정리 | frontend/src/contexts/AuthContext.tsx:206-208 | ✅ 수정 완료 |

### ⚠️ Warning: 2건

| 이슈 | 설명 | 우선순위 |
|------|------|----------|
| RefreshToken 미구현 | /auth/refresh 엔드포인트 없음 | P1 |
| 분산된 localStorage 접근 | 52개 위치에서 직접 접근 | P2 |

---

## 3. 긴급 수정 내역 (CVE-002, CVE-003)

### ✅ 수정 완료: AuthContext logout 함수

**파일**: `frontend/src/contexts/AuthContext.tsx`

**변경 사항**:

1. **localStorage.clear() + sessionStorage.clear() 추가**
   ```typescript
   // Before
   localStorage.removeItem('accessToken');
   localStorage.removeItem('refreshToken');
   localStorage.removeItem('userId');

   // After
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **로그인 페이지 강제 리다이렉트**
   ```typescript
   // 추가됨
   window.location.href = '/login';
   ```

3. **디버깅 로그 추가**
   - 로그아웃 시작/종료 로그
   - localStorage 상태 출력
   - API 호출 성공/실패 로그

### ✅ 추가 개선: checkAuth 함수 로깅

**변경 사항**:
- checkAuth 실행 시 localStorage 상태 로그
- /auth/me API 호출 및 응답 로그
- 사용자 인증 성공 시 userId, role, username 출력

**효과**:
- 로그아웃 버그 재현 시 정확한 원인 파악 가능
- 프로덕션 환경에서는 console.log 제거 또는 환경 변수로 제어 권장

---

## 4. 남은 작업

### 🔴 높은 우선순위 (P0)

#### CVE-001: 백엔드 로그아웃 함수 구현

**현재 상태**:
```typescript
// backend/src/auth/auth.service.ts
async logout(userId: number): Promise<void> {
  // Logout logic (if needed, e.g., token blacklist) ← 비어있음
}
```

**수정 방안**:

**Option 1: Redis 토큰 블랙리스트** (권장)
```typescript
async logout(userId: number): Promise<void> {
  const token = // 현재 요청의 JWT 토큰 가져오기
  const decoded = this.jwtService.decode(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000); // 남은 만료 시간

  // Redis에 블랙리스트 추가
  await this.redis.setex(`blacklist:${token}`, ttl, '1');
}
```

**Option 2: DB 세션 테이블** (장기 로그 저장 필요 시)
```typescript
async logout(userId: number): Promise<void> {
  // sessions 테이블에서 해당 사용자 세션 무효화
  await this.sessionsRepository.update(
    { userId, isActive: true },
    { isActive: false, logoutAt: new Date() }
  );
}
```

**필요한 추가 작업**:
- JwtAuthGuard에서 블랙리스트 체크 로직 추가
- Redis 연동 (Option 1 선택 시)

---

### 🟠 중간 우선순위 (P1)

#### RefreshToken 시스템 구현

**현재 문제**:
- 프론트엔드에 handleRefreshToken() 함수는 있지만
- 백엔드에 /auth/refresh 엔드포인트가 없음
- Access Token 만료 시 자동 갱신 불가

**구현 필요**:

1. **백엔드 Refresh API**
```typescript
@Post('refresh')
async refresh(@Body() dto: RefreshTokenDto) {
  const { userId, refreshToken } = dto;
  // RefreshToken 검증
  // 새로운 AccessToken 발급
  // (선택) RefreshToken Rotation
}
```

2. **login 응답에 refreshToken 포함**
```typescript
return {
  access_token: accessToken,
  refresh_token: refreshToken, // 추가
  user: { ... }
};
```

3. **JWT 만료 시간 설정**
```typescript
const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
```

---

### 🟡 낮은 우선순위 (P2)

#### API 호출 중앙화

**문제**: 52개 파일에서 `localStorage.getItem('accessToken')` 직접 호출

**해결책**: Axios 인터셉터 또는 Fetch wrapper 생성

```typescript
// lib/api.ts
const api = {
  async fetch(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem('accessToken');
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  }
};
```

**장점**:
- 토큰 관리 로직 한 곳에 집중
- 401 에러 시 자동 토큰 갱신 구현 용이
- 향후 보안 패치 적용 쉬움

---

## 5. 테스트 가이드

### 🧪 로그아웃 버그 재현 테스트

1. **기본 시나리오**
   ```
   1. admin 계정으로 로그인
   2. 브라우저 개발자 도구 > Application > Local Storage 확인
   3. 로그아웃 버튼 클릭
   4. Console에서 [AUTH] 로그 확인
   5. /login 페이지로 리다이렉트되는지 확인
   6. Local Storage가 완전히 비어있는지 확인
   ```

2. **다중 탭 테스트**
   ```
   1. 탭 A에서 로그인
   2. 탭 B 열기 (같은 세션)
   3. 탭 A에서 로그아웃
   4. 탭 B를 새로고침
   5. 탭 B도 로그아웃 상태인지 확인
   ```

3. **토큰 탈취 시뮬레이션**
   ```
   1. 로그인 후 Console에서 토큰 복사
      > localStorage.getItem('accessToken')
   2. 로그아웃
   3. curl로 복사한 토큰으로 API 호출
      > curl -H "Authorization: Bearer <token>" http://localhost:3001/admin/statistics
   4. 현재: 여전히 접근 가능 (CVE-001 미수정)
   5. 기대: 403 Forbidden (CVE-001 수정 후)
   ```

---

## 6. 모니터링 권장사항

### 프로덕션 배포 후 모니터링

1. **로그 수집**
   - `[AUTH]` 태그가 붙은 모든 로그 수집
   - 특히 "Logout completed" 로그 확인
   - localStorage.length !== 0 경우 알림

2. **에러 트래킹**
   - Sentry 등에 auth 관련 에러 추적
   - 401/403 에러 발생 빈도 모니터링

3. **사용자 피드백**
   - 로그아웃 후 재로그인 문제 보고 수집

---

## 7. 결론

### ✅ 완료된 작업

- [x] 보안 취약점 조사 및 보고서 작성
- [x] CVE-002: 로그아웃 후 리다이렉트 추가
- [x] CVE-003: sessionStorage 정리 추가
- [x] 디버깅 로그 추가

### ⏳ 남은 작업

- [ ] **CVE-001**: 백엔드 로그아웃 함수 구현 (토큰 블랙리스트)
- [ ] RefreshToken 시스템 완성
- [ ] API 호출 중앙화 (axios 인터셉터)
- [ ] JWT 만료 시간 명시적 설정

### 📊 보안 개선 효과

| 항목 | Before | After |
|------|--------|-------|
| 로그아웃 후 localStorage | 일부 항목만 삭제 | 완전히 정리 (clear) |
| sessionStorage | 방치됨 | 정리됨 |
| 로그아웃 후 페이지 | 그대로 유지 | /login 리다이렉트 |
| 디버깅 가능성 | 낮음 (로그 없음) | 높음 (상세 로그) |
| 토큰 무효화 | ❌ 불가능 | ⏳ 구현 대기 |

---

## 8. 다음 단계

1. **즉시 테스트** (사용자 직접)
   - 로그아웃 → 로그인 플로우 테스트
   - 브라우저 Console 확인
   - 버그 재현되는지 확인

2. **CVE-001 수정** (개발자)
   - Redis 또는 DB 기반 토큰 블랙리스트 구현
   - JwtAuthGuard 수정

3. **장기 개선** (Sprint 계획)
   - RefreshToken 시스템
   - API 중앙화
   - 보안 테스트 자동화

---

**작성자**: Security Audit Team
**검토 필요**: Backend 로그아웃 로직 구현 후 재점검
**문서 위치**:
- [보안 점검 계획](./security-audit-plan.md)
- [상세 취약점 보고서](./security-vulnerabilities-report.md)
