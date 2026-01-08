# UI 개선 계획서

## 목표
GGS Helper의 UI/UX를 개선하여 더욱 모던하고 일관성 있는 사용자 경험 제공

## 컬러 팔레트

### 색상 정의
| 용도 | 색상 코드 | 설명 |
|------|----------|------|
| Primary | `#111827` | 주요 텍스트, 헤더 배경 (Near Black) |
| Secondary | `#374151` | 보조 텍스트, 비활성 요소 |
| Accent | `#0EA5E9` | 버튼, 링크, 강조 요소 (시원한 포인트) |
| Background | `#FFFFFF` | 페이지 배경 |
| Surface | `#F3F4F6` | 카드, 패널 배경 |
| Line | `#D1D5DB` | 구분선, 테두리 |

### Tailwind CSS 매핑
```css
/* tailwind.config.js 커스텀 컬러 */
colors: {
  primary: '#111827',      // gray-900
  secondary: '#374151',    // gray-700
  accent: '#0EA5E9',       // sky-500
  background: '#FFFFFF',   // white
  surface: '#F3F4F6',      // gray-100
  line: '#D1D5DB',         // gray-300
}
```

## 구현 단계

### Phase 1: 기본 컬러 시스템 설정
**목표**: Tailwind 설정 및 전역 스타일 적용

#### 작업 항목
1. **Tailwind Config 업데이트**
   - `frontend/tailwind.config.js` 수정
   - 커스텀 컬러 팔레트 정의
   - 기존 색상 매핑 확인

2. **전역 CSS 변수 정의**
   - `frontend/src/index.css` 업데이트
   - CSS 변수로 컬러 팔레트 등록
   ```css
   :root {
     --color-primary: #111827;
     --color-secondary: #374151;
     --color-accent: #0EA5E9;
     --color-background: #FFFFFF;
     --color-surface: #F3F4F6;
     --color-line: #D1D5DB;
   }
   ```

3. **기존 컬러 매핑 분석**
   - 현재 사용 중인 `blue-600`, `gray-*` 색상 확인
   - 신규 팔레트로 변환 매핑 테이블 작성

### Phase 2: 공통 컴포넌트 개선
**목표**: 재사용 가능한 UI 컴포넌트 스타일 통일

#### 2.1 Header 컴포넌트
**파일**: `frontend/src/components/layout/Header.tsx`

**변경 사항**:
- 배경색: `bg-white` → `bg-primary` (dark header)
- 텍스트: `text-gray-900` → `text-white`
- 로고 배경: `bg-blue-600` → `bg-accent`
- 링크 hover: `text-blue-600` → `text-accent`
- 관리자 링크: `text-red-600` → `text-accent`

#### 2.2 Button 컴포넌트
**파일**: `frontend/src/components/ui/button.tsx`

**variant별 스타일**:
```typescript
// Primary Button
default: "bg-accent text-white hover:bg-accent/90"

// Secondary Button
secondary: "bg-surface text-primary hover:bg-secondary/10"

// Outline Button
outline: "border-line text-primary hover:bg-surface"

// Ghost Button
ghost: "text-secondary hover:bg-surface hover:text-primary"
```

#### 2.3 Input 컴포넌트
**파일**: `frontend/src/components/ui/input.tsx`

**스타일**:
- Border: `border-line`
- Focus: `focus:ring-accent focus:border-accent`
- Background: `bg-white`
- Text: `text-primary`
- Placeholder: `placeholder:text-secondary/50`

#### 2.4 Card 컴포넌트
**파일**: `frontend/src/components/ui/card.tsx`

**스타일**:
- Background: `bg-white`
- Border: `border-line`
- Shadow: `shadow-sm`
- Header: `text-primary`
- Description: `text-secondary`

### Phase 3: 페이지별 UI 개선

#### 3.1 로그인/회원가입 페이지
**파일**:
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/RegisterPage.tsx`

**개선 사항**:
- 배경: `bg-gray-50` → `bg-surface`
- 로고 배경: `bg-blue-600` → `bg-accent`
- 제목: `text-gray-900` → `text-primary`
- 설명: `text-gray-600` → `text-secondary`
- 버튼: Accent 컬러 적용
- 링크: `text-blue-600` → `text-accent`

#### 3.2 예약 관련 페이지
**파일**:
- `frontend/src/pages/PublicReservationsPage.tsx`
- `frontend/src/pages/CreateReservationPage.tsx`
- `frontend/src/pages/MyReservationsPage.tsx`

**개선 사항**:
- 카드 배경: `bg-white` 유지, 테두리 `border-line`
- 상태 배지:
  - 승인: `bg-accent/10 text-accent`
  - 대기: `bg-yellow-50 text-yellow-700` (유지)
  - 취소: `bg-secondary/10 text-secondary`
- 액션 버튼: Accent 컬러 사용
- 구분선: `border-line`

#### 3.3 관리자 페이지
**파일**: `frontend/src/pages/AdminPage.tsx` 등

**개선 사항**:
- 사이드바: `bg-primary text-white`
- 활성 메뉴: `bg-accent`
- 통계 카드: `bg-surface` 배경
- 테이블 헤더: `bg-surface text-primary`
- 액션 버튼: Accent 컬러

### Phase 4: 세부 요소 개선

#### 4.1 아이콘 색상
- Primary 아이콘: `text-primary`
- Secondary 아이콘: `text-secondary`
- Accent 아이콘: `text-accent`

#### 4.2 알림/메시지
**에러**:
- Background: `bg-red-50`
- Border: `border-red-200`
- Text: `text-red-700`

**성공**:
- Background: `bg-green-50`
- Border: `border-green-200`
- Text: `text-green-700`

**정보**:
- Background: `bg-accent/10`
- Border: `border-accent/20`
- Text: `text-accent`

#### 4.3 호버 효과 통일
- 카드 호버: `hover:shadow-md transition-shadow`
- 버튼 호버: `hover:opacity-90 transition-opacity`
- 링크 호버: `hover:text-accent transition-colors`

### Phase 5: 다크 모드 준비 (선택사항)
**목표**: 향후 다크 모드 지원 가능하도록 구조화

#### 작업 항목
1. CSS 변수 기반 테마 시스템 구축
2. `dark:` prefix 사용한 다크 모드 스타일 정의
3. 테마 토글 컴포넌트 추가

## 구현 우선순위

### 우선순위 1 (필수)
- [x] Tailwind config 업데이트
- [ ] Header 컴포넌트 개선
- [ ] Button 컴포넌트 스타일링
- [ ] 로그인/회원가입 페이지 개선

### 우선순위 2 (중요)
- [ ] Input, Card 컴포넌트 개선
- [ ] 예약 페이지 UI 개선
- [ ] 공통 알림 컴포넌트 스타일링

### 우선순위 3 (추가)
- [ ] 관리자 페이지 개선
- [ ] 애니메이션 효과 추가
- [ ] 반응형 디자인 최적화

## 주의사항

### 브레이킹 체인지 방지
- 기존 기능 동작에 영향 없도록 스타일만 변경
- 클래스명 변경 시 전체 검색 후 일괄 수정
- 컴포넌트 props는 변경하지 않음

### 일관성 유지
- 모든 페이지에서 동일한 컬러 팔레트 사용
- 버튼, 링크 등 상호작용 요소는 Accent 컬러 통일
- 간격(spacing)과 타이포그래피도 일관성 유지

### 접근성 고려
- 색상 대비 비율 확인 (WCAG AA 기준)
- Primary (#111827) vs Background (#FFFFFF): 16.7:1 ✅
- Accent (#0EA5E9) vs Background (#FFFFFF): 3.2:1 ⚠️ (큰 텍스트만)
- Accent 컬러는 버튼/링크에만 사용

## 테스트 계획

### 시각적 테스트
1. 모든 페이지 스크린샷 비교 (before/after)
2. 다양한 화면 크기에서 확인 (모바일, 태블릿, 데스크톱)
3. 브라우저 호환성 테스트 (Chrome, Firefox, Safari)

### 기능 테스트
1. 모든 버튼/링크 클릭 동작 확인
2. 폼 입력 및 제출 테스트
3. 호버/포커스 상태 확인

## 예상 소요 시간
- Phase 1: 30분
- Phase 2: 1-2시간
- Phase 3: 2-3시간
- Phase 4: 1시간
- 총 예상 시간: 4-6시간

## 참고 자료
- Tailwind CSS 공식 문서: https://tailwindcss.com/docs
- 색상 대비 체크: https://webaim.org/resources/contrastchecker/
- Material Design 컬러 가이드: https://material.io/design/color
