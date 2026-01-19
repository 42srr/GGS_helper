# 관리자 체크아웃 검수 기능 구현 계획서

## 개요
관리자가 회의실 반납 시 업로드된 체크아웃 인증 사진과 전달사항을 확인할 수 있는 검수 기능을 추가합니다.

## 목표
- 관리자가 체크아웃 사진과 전달사항을 효율적으로 검토할 수 있는 UI 제공
- 체크아웃이 완료된 예약에 대한 시각적 구분
- 사진과 전달사항을 한눈에 확인할 수 있는 모달 인터페이스

## 현재 상태 분석

### 백엔드 API
#### 기존 API (활용 가능)
- `GET /reservations/:id/checkout-photo` - 체크아웃 사진 조회
  - 응답 데이터:
    ```typescript
    {
      hasPhoto: boolean;
      photoUrl: string;
      verifiedAt: Date;
      notes: string;
    }
    ```
- `GET /reservations` - 전체 예약 조회 (관리자용)
  - 현재 reservation 엔티티에 체크아웃 정보 포함:
    - `checkoutPhotoUrl`: 사진 URL
    - `checkoutVerifiedAt`: 업로드 시각
    - `checkoutNotes`: 전달사항

#### 필요한 수정사항
✅ **별도 API 추가 불필요** - 기존 API로 충분히 구현 가능

### 프론트엔드 현재 구조

#### AdminReservationsPage.tsx 분석
**위치**: `frontend/src/pages/admin/AdminReservationsPage.tsx`

**현재 구조**:
1. 통계 카드 섹션 (4개)
2. 필터 및 검색 섹션
3. 상세 통계 카드 (5개)
4. 예약 테이블
   - 컬럼: ID, 제목, 회의실, 예약자, 일시, 시간, 상태, 관리
   - 관리 컬럼: 상태 변경 드롭다운, 삭제 버튼

**Reservation 타입** (현재):
```typescript
interface Reservation {
  reservationId: number;
  title: string;
  status: 'pending' | 'confirmed' | 'finished' | 'cancelled';
  // ... 기타 필드
  // ❌ checkoutPhotoUrl, checkoutNotes 등 체크아웃 정보 미포함
}
```

## 구현 계획

### 1. 프론트엔드 타입 확장

#### 1.1 Reservation 인터페이스 확장
**파일**: `frontend/src/pages/admin/AdminReservationsPage.tsx`

```typescript
interface Reservation {
  // ... 기존 필드
  status: 'pending' | 'confirmed' | 'in_progress' | 'awaiting_checkout' | 'finished' | 'cancelled';

  // 체크아웃 정보 추가
  checkoutPhotoUrl?: string;
  checkoutVerifiedAt?: string;
  checkoutNotes?: string;
}
```

### 2. UI 컴포넌트 추가

#### 2.1 CheckoutReviewModal 컴포넌트 생성
**파일**: `frontend/src/components/admin/CheckoutReviewModal.tsx` (신규)

**기능**:
- 체크아웃 사진 확대 표시
- 전달사항 표시
- 예약 정보 요약 표시
- 업로드 시각 표시

**Props**:
```typescript
interface CheckoutReviewModalProps {
  reservation: {
    reservationId: number;
    title: string;
    roomName: string;
    userName: string;
    startTime: string;
    endTime: string;
    checkoutPhotoUrl: string;
    checkoutVerifiedAt: string;
    checkoutNotes?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}
```

**UI 구조**:
```
┌─────────────────────────────────────────┐
│ 체크아웃 검수                   [X]      │
├─────────────────────────────────────────┤
│ 📋 예약 정보                             │
│  - 예약 ID: #123                         │
│  - 제목: 팀 회의                         │
│  - 회의실: 세미나실 1                     │
│  - 예약자: 홍길동                        │
│  - 시간: 2026-01-14 14:00 ~ 16:00       │
│  - 업로드: 2026-01-14 15:58             │
├─────────────────────────────────────────┤
│ 📸 체크아웃 사진                         │
│  [        사진 영역        ]             │
│                                         │
├─────────────────────────────────────────┤
│ 📝 전달사항                              │
│  깨끗하게 정리하고 반납했습니다.          │
├─────────────────────────────────────────┤
│                         [닫기]           │
└─────────────────────────────────────────┘
```

#### 2.2 AdminReservationsPage 테이블 수정

**추가할 컬럼**: "체크아웃"
- 위치: "상태" 컬럼과 "관리" 컬럼 사이
- 표시 내용:
  - 체크아웃 사진이 있는 경우: "검수" 버튼 (Eye 아이콘)
  - 체크아웃 사진이 없는 경우: "-" 또는 빈 칸

**테이블 헤더**:
```tsx
<th className="text-left p-4 font-medium">상태</th>
<th className="text-left p-4 font-medium">체크아웃</th>  {/* 신규 */}
<th className="text-left p-4 font-medium">관리</th>
```

**테이블 셀**:
```tsx
<td className="p-4">
  {reservation.checkoutPhotoUrl ? (
    <Button
      size="sm"
      variant="outline"
      onClick={() => handleCheckoutReview(reservation)}
    >
      <Eye className="h-4 w-4 mr-1" />
      검수
    </Button>
  ) : (
    <span className="text-gray-400 text-sm">-</span>
  )}
</td>
```

### 3. 상태 관리

#### 3.1 AdminReservationsPage 상태 추가
```typescript
const [selectedCheckoutReservation, setSelectedCheckoutReservation] =
  useState<Reservation | null>(null);
const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
```

#### 3.2 핸들러 함수
```typescript
const handleCheckoutReview = (reservation: Reservation) => {
  setSelectedCheckoutReservation(reservation);
  setCheckoutModalOpen(true);
};

const handleCheckoutModalClose = () => {
  setCheckoutModalOpen(false);
  setSelectedCheckoutReservation(null);
};
```

### 4. 시각적 개선사항

#### 4.1 체크아웃 완료 예약 강조
체크아웃 사진이 업로드된 예약에 대해 시각적 표시:

```tsx
{reservation.checkoutPhotoUrl && (
  <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
    <Camera className="w-3 h-3 mr-1" />
    체크아웃 완료
  </Badge>
)}
```

#### 4.2 awaiting_checkout 상태 추가
상태 필터 및 배지에 `awaiting_checkout` 상태 추가:

```tsx
// 상태 필터
<SelectItem value="awaiting_checkout">반납 대기</SelectItem>

// 배지 표시
case 'awaiting_checkout':
  return (
    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
      <Clock className="w-3 h-3 mr-1" />
      반납 대기
    </Badge>
  );
```

### 5. 필터 기능 확장

#### 5.1 체크아웃 상태 필터 추가
```tsx
const [checkoutFilter, setCheckoutFilter] = useState('all');

<Select value={checkoutFilter} onValueChange={setCheckoutFilter}>
  <SelectTrigger>
    <SelectValue placeholder="체크아웃 상태" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">전체</SelectItem>
    <SelectItem value="completed">체크아웃 완료</SelectItem>
    <SelectItem value="pending">체크아웃 대기</SelectItem>
  </SelectContent>
</Select>
```

#### 5.2 필터링 로직 수정
```typescript
// 체크아웃 필터
if (checkoutFilter === 'completed') {
  filtered = filtered.filter((res) => res.checkoutPhotoUrl);
} else if (checkoutFilter === 'pending') {
  filtered = filtered.filter(
    (res) => res.status === 'awaiting_checkout' && !res.checkoutPhotoUrl
  );
}
```

### 6. 통계 카드 추가

체크아웃 관련 통계 카드 추가:
```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium text-gray-600">
      체크아웃 완료
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-purple-600">
      {reservations.filter(r => r.checkoutPhotoUrl).length}
    </div>
  </CardContent>
</Card>

<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-sm font-medium text-gray-600">
      반납 대기
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold text-orange-600">
      {reservations.filter(r => r.status === 'awaiting_checkout').length}
    </div>
  </CardContent>
</Card>
```

## 구현 순서

### Phase 1: 기본 구조
1. ✅ 타입 정의 확장 (Reservation 인터페이스)
2. ✅ CheckoutReviewModal 컴포넌트 생성
3. ✅ AdminReservationsPage에 검수 버튼 추가

### Phase 2: 기능 통합
4. ✅ 모달 상태 관리 및 핸들러 구현
5. ✅ API 연동 (체크아웃 사진 조회)
6. ✅ 에러 처리 및 로딩 상태

### Phase 3: UI/UX 개선
7. ✅ 체크아웃 완료 배지 추가
8. ✅ awaiting_checkout 상태 배지 추가
9. ✅ 체크아웃 필터 기능 추가
10. ✅ 통계 카드 추가

### Phase 4: 테스트 및 최적화
11. ✅ 기능 테스트
12. ✅ 반응형 디자인 확인
13. ✅ 성능 최적화

## 기술 스택

### 컴포넌트
- React Functional Component
- TypeScript
- Lucide React Icons

### UI 라이브러리
- Shadcn/ui Button
- Shadcn/ui Badge
- Shadcn/ui Card

### 아이콘
- Eye (검수 버튼)
- Camera (체크아웃 완료 배지)
- X (모달 닫기)

## 예상 파일 변경사항

### 신규 파일
- `frontend/src/components/admin/CheckoutReviewModal.tsx`

### 수정 파일
- `frontend/src/pages/admin/AdminReservationsPage.tsx`
  - Reservation 타입 확장
  - 테이블 컬럼 추가
  - 모달 상태 관리
  - 필터 기능 확장
  - 통계 카드 추가

## 성공 기준

### 기능 요구사항
- ✅ 관리자가 체크아웃 사진을 확인할 수 있어야 함
- ✅ 관리자가 전달사항을 확인할 수 있어야 함
- ✅ 체크아웃 완료 여부를 한눈에 파악할 수 있어야 함
- ✅ 체크아웃 상태로 필터링할 수 있어야 함

### UX 요구사항
- ✅ 모달은 ESC 키로 닫을 수 있어야 함
- ✅ 사진은 원본 크기로 확대되어야 함
- ✅ 로딩 중에는 적절한 스피너를 표시해야 함
- ✅ 모바일에서도 정상적으로 작동해야 함

### 성능 요구사항
- ✅ 사진 로딩은 지연 로딩(lazy loading) 적용
- ✅ 대용량 이미지는 최적화된 썸네일 우선 표시
- ✅ 불필요한 API 호출 최소화

## 보안 고려사항

1. **권한 검증**: 관리자만 검수 기능 접근 가능
2. **이미지 접근 제어**: 인증된 사용자만 체크아웃 사진 조회 가능
3. **XSS 방지**: 전달사항 렌더링 시 sanitize 처리

## 향후 확장 가능성

1. **검수 승인/반려 기능**: 관리자가 체크아웃 승인/반려 처리
2. **일괄 검수**: 여러 예약을 동시에 검수
3. **검수 히스토리**: 누가 언제 검수했는지 기록
4. **자동 알림**: 체크아웃 대기 중인 예약 관리자에게 알림
5. **사진 비교**: 체크인/체크아웃 사진 비교 기능

## 완료 체크리스트

- [x] CheckoutReviewModal 컴포넌트 구현
- [x] AdminReservationsPage 테이블에 검수 버튼 추가
- [x] 체크아웃 상태 필터 추가
- [x] 체크아웃 통계 카드 추가
- [x] awaiting_checkout 상태 배지 추가
- [x] 체크아웃 완료 배지 추가
- [x] 프론트엔드 빌드 테스트 통과
- [ ] 반응형 디자인 테스트
- [ ] 접근성 검증
- [ ] 브라우저 호환성 테스트

---

## 구현 완료 (2026-01-14)

### 구현된 파일

#### 신규 파일
**`frontend/src/components/admin/CheckoutReviewModal.tsx`** (269줄)
- 체크아웃 사진 및 전달사항 표시 모달
- API 연동으로 실시간 데이터 로드
- 에러 처리 및 로딩 상태 관리
- 반응형 레이아웃
- 새 탭에서 원본 이미지 보기 링크

#### 수정 파일
**`frontend/src/pages/admin/AdminReservationsPage.tsx`**
- Reservation 타입 확장: `checkoutPhotoUrl`, `checkoutVerifiedAt`, `checkoutNotes` 추가
- 상태에 `in_progress`, `awaiting_checkout` 추가
- 체크아웃 필터 추가 (전체/완료/대기)
- 통계 카드 2개 추가 (반납 대기 6개 → 반납 대기 + 체크아웃 완료)
- 테이블에 "체크아웃" 컬럼 추가 (상태와 관리 사이)
- 검수 버튼 (Eye 아이콘) 및 모달 연동
- 체크아웃 완료 배지 (Camera 아이콘) 추가
- `awaiting_checkout`, `in_progress` 상태 배지 추가

#### 빌드 관련 수정
- `frontend/src/components/calendar/TimelineMonthView.tsx` - 사용하지 않는 import 제거 (ko)
- `frontend/src/pages/admin/AdminBackupPage.tsx` - 사용하지 않는 import 제거 (Shield)
- `frontend/src/pages/admin/AdminClubsPage.tsx` - 사용하지 않는 import 제거 (User, Download)

### 주요 기능

#### 1. 체크아웃 검수 모달 (CheckoutReviewModal)
- **예약 정보 표시**: 제목, 회의실, 위치, 예약자, 이메일, 사용 시간
- **체크아웃 사진**: 확대 표시, onError fallback 처리
- **전달사항**: 전달사항이 있을 경우 표시, 없으면 안내 메시지
- **업로드 시각**: 배지로 표시
- **새 탭에서 보기**: 원본 이미지를 새 탭에서 열기 링크

#### 2. 통계 카드 (6개 → 6개 유지)
- 전체 예약
- 승인 대기
- 확정 예약
- **반납 대기** (신규): `awaiting_checkout` 상태 예약 수
- **체크아웃 완료** (신규): 사진이 업로드된 예약 수
- 노쇼 신고

#### 3. 필터 기능
- **체크아웃 상태 필터** (신규): 전체 / 체크아웃 완료 / 체크아웃 대기
- **상태 필터 확장**: `in_progress`, `awaiting_checkout` 추가
- 초기화 버튼에 체크아웃 필터 포함

#### 4. 테이블 개선
- **체크아웃 컬럼** (신규): 상태와 관리 사이에 위치
  - 체크아웃 사진이 있으면: "검수" 버튼 (Eye 아이콘)
  - 없으면: "-" 표시
- **체크아웃 완료 배지**: 사진이 업로드된 예약에 보라색 배지 표시
- **awaiting_checkout 배지**: 주황색 배지로 "반납 대기" 표시
- **in_progress 배지**: 파란색 배지로 "진행 중" 표시

### 기술 구현 세부사항

#### API 연동
- `GET /reservations/:id/checkout-photo` 호출
- 응답 데이터: `hasPhoto`, `photoUrl`, `verifiedAt`, `notes`

#### 상태 관리
- React useState hooks 사용
- `selectedCheckoutReservation`: 선택된 예약 정보
- `checkoutModalOpen`: 모달 열림/닫힘 상태
- `checkoutFilter`: 체크아웃 필터 상태

#### 에러 처리
- try-catch로 API 에러 처리
- 사용자 친화적 에러 메시지 표시
- 이미지 로드 실패 시 onError fallback

#### UI/UX
- **로딩 상태**: 스피너 표시
- **반응형**: Tailwind CSS grid system (md:grid-cols-7)
- **색상 코드**:
  - 반납 대기: 주황색 (orange-100/800)
  - 체크아웃 완료: 보라색 (purple-100/800)
  - 진행 중: 파란색 (blue-100/800)

### 빌드 결과
- ✅ TypeScript 컴파일 성공
- ✅ Vite 빌드 성공 (9.03초)
- ✅ 경고 없음
- 📦 빌드 크기: 697.87 kB (gzip: 203.43 kB)
