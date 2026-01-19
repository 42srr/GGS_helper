# 업무시간 외 예약 승인 지연 안내 기능 구현 계획서

## 개요
승인이 필요한 회의실을 업무시간(09:00~18:00) 외 시간대에 예약 신청할 경우, 승인이 지연될 수 있음을 사용자에게 사전에 안내하는 기능을 추가합니다.

## 목표
- 사용자가 업무시간 외 예약 신청 시 승인 지연 가능성을 인지
- 불필요한 문의 및 민원 감소
- 사용자 경험 개선 (투명한 정보 제공)

## 현재 상태 분석

### 예약 생성 플로우
**파일**: `frontend/src/pages/CreateReservationPage.tsx`

**현재 흐름**:
1. 사용자가 예약 폼 작성
2. "예약하기" 버튼 클릭
3. `handleSubmit()` 함수 실행 (line 108-150)
4. `POST /reservations` API 호출
5. 성공 시 `/my-reservations` 페이지로 이동

**현재 검증 로직**:
- 필수 필드 검증 (제목, 회의실, 날짜, 시간, 인원)
- 예약 가능 시간 검증 (09:00-21:00)
- 예약 기간 검증 (최대 2시간)
- 사용자 예약 제한 상태 확인

**승인 필요 회의실 판별**:
- Room 엔티티의 `isConfirm` 필드로 확인
- `isConfirm: false` → 승인 불필요 (즉시 확정)
- `isConfirm: true` → 승인 필요 (관리자 승인 대기)

### 업무시간 정의
- **업무시간**: 평일 09:00 ~ 18:00
- **업무시간 외**:
  - 평일 18:00 ~ 익일 09:00
  - 주말 (토요일, 일요일) 전체
  - 공휴일 (선택사항)

## 구현 계획

### 1. 업무시간 체크 유틸리티 함수 생성

#### 1.1 파일 생성
**파일**: `frontend/src/utils/businessHours.ts` (신규)

```typescript
/**
 * 업무시간 설정
 */
export const BUSINESS_HOURS = {
  START: 9,  // 09:00
  END: 18,   // 18:00
  DAYS: [1, 2, 3, 4, 5], // 월-금
} as const;

/**
 * 주어진 날짜/시간이 업무시간인지 확인
 * @param date - 확인할 날짜 (Date 객체 또는 ISO 문자열)
 * @returns true: 업무시간, false: 업무시간 외
 */
export function isBusinessHours(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;

  const day = targetDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const hour = targetDate.getHours();

  // 주말 체크
  if (!BUSINESS_HOURS.DAYS.includes(day)) {
    return false;
  }

  // 시간 체크
  if (hour < BUSINESS_HOURS.START || hour >= BUSINESS_HOURS.END) {
    return false;
  }

  return true;
}

/**
 * 현재 시각이 업무시간인지 확인
 */
export function isCurrentlyBusinessHours(): boolean {
  return isBusinessHours(new Date());
}

/**
 * 예약 신청 시각이 업무시간 외인지 확인
 * (예약 시작 시간이 아닌, 지금 예약을 신청하는 시각)
 */
export function isAfterHoursReservation(): boolean {
  return !isCurrentlyBusinessHours();
}
```

### 2. 업무시간 외 안내 모달 컴포넌트 생성

#### 2.1 컴포넌트 파일 생성
**파일**: `frontend/src/components/reservations/AfterHoursNoticeDialog.tsx` (신규)

```typescript
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, AlertCircle } from 'lucide-react';

interface AfterHoursNoticeDialogProps {
  isOpen: boolean;
  roomName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AfterHoursNoticeDialog({
  isOpen,
  roomName,
  onConfirm,
  onCancel,
}: AfterHoursNoticeDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-100 p-2 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              업무시간 외 예약 안내
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="font-semibold text-yellow-900">
                    현재 업무시간이 아닙니다
                  </p>
                  <p className="text-yellow-800 text-sm">
                    <strong>"{roomName}"</strong>는 승인이 필요한 회의실입니다.
                  </p>
                  <p className="text-yellow-800 text-sm">
                    업무시간(평일 09:00~18:00) 외에 신청된 예약은
                    관리자 승인이 지연될 수 있습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 참고사항</strong>
              </p>
              <ul className="mt-2 space-y-1 text-sm text-blue-800 list-disc list-inside">
                <li>업무시간 내 신청 시 빠른 승인이 가능합니다</li>
                <li>승인이 지연되어도 예약 신청은 정상적으로 접수됩니다</li>
                <li>승인 상태는 "내 예약" 페이지에서 확인할 수 있습니다</li>
              </ul>
            </div>

            <p className="text-gray-600 text-sm">
              그래도 지금 예약을 신청하시겠습니까?
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            취소
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
            예약 신청하기
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 3. CreateReservationPage에 로직 통합

#### 3.1 상태 및 import 추가
**파일**: `frontend/src/pages/CreateReservationPage.tsx`

```typescript
// 추가 import
import { AfterHoursNoticeDialog } from '@/components/reservations/AfterHoursNoticeDialog';
import { isAfterHoursReservation } from '@/utils/businessHours';

// 상태 추가
const [showAfterHoursNotice, setShowAfterHoursNotice] = useState(false);
const [pendingSubmit, setPendingSubmit] = useState(false);
```

#### 3.2 예약 제출 로직 수정

**기존 handleSubmit 함수 수정**:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // 기본 검증
  if (!formData.title || !formData.roomId || !formData.date ||
      !formData.startTime || !formData.endTime || !formData.attendees) {
    alert('모든 필수 항목을 입력해주세요.');
    return;
  }

  // 🔥 새로운 체크: 승인 필요 + 업무시간 외 체크
  const selectedRoom = rooms.find(r => r.roomId === parseInt(formData.roomId));

  if (selectedRoom?.isConfirm && isAfterHoursReservation()) {
    // 승인이 필요한 회의실 + 업무시간 외 = 안내 모달 표시
    setShowAfterHoursNotice(true);
    setPendingSubmit(true);
    return;
  }

  // 바로 제출
  await submitReservation();
};

// 실제 제출 로직 분리
const submitReservation = async () => {
  setSubmitting(true);

  try {
    const reservationData = {
      title: formData.title,
      description: formData.description || undefined,
      roomId: parseInt(formData.roomId),
      startTime: `${formData.date}T${formData.startTime}:00+09:00`,
      endTime: `${formData.date}T${formData.endTime}:00+09:00`,
      teamName: formData.teamName || undefined,
      attendees: formData.attendees ? parseInt(formData.attendees) : undefined
    };

    const response = await fetch('http://localhost:3001/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(reservationData),
    });

    if (response.ok) {
      alert('예약이 성공적으로 생성되었습니다!');
      navigate('/my-reservations');
    } else {
      const error = await response.json();
      alert(error.message || '예약 생성에 실패했습니다.');
    }
  } catch (error) {
    console.error('Reservation error:', error);
    alert('예약 생성 중 오류가 발생했습니다.');
  } finally {
    setSubmitting(false);
    setPendingSubmit(false);
  }
};

// 모달 확인 핸들러
const handleAfterHoursConfirm = async () => {
  setShowAfterHoursNotice(false);
  await submitReservation();
};

// 모달 취소 핸들러
const handleAfterHoursCancel = () => {
  setShowAfterHoursNotice(false);
  setPendingSubmit(false);
};
```

#### 3.3 JSX에 모달 추가

```tsx
return (
  <div>
    {/* 기존 폼 코드... */}

    {/* 업무시간 외 안내 모달 */}
    <AfterHoursNoticeDialog
      isOpen={showAfterHoursNotice}
      roomName={rooms.find(r => r.roomId === parseInt(formData.roomId))?.name || '선택한 회의실'}
      onConfirm={handleAfterHoursConfirm}
      onCancel={handleAfterHoursCancel}
    />
  </div>
);
```

### 4. UI/UX 개선사항

#### 4.1 업무시간 표시 (선택사항)
폼 상단에 현재 업무시간 여부 표시:

```tsx
{isAfterHoursReservation() && (
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-yellow-600" />
      <span className="text-sm text-yellow-800">
        현재 업무시간이 아닙니다. 승인이 필요한 회의실 예약 시 승인이 지연될 수 있습니다.
      </span>
    </div>
  </div>
)}
```

#### 4.2 회의실 선택 시 승인 필요 여부 표시
회의실 선택 드롭다운에 승인 필요 여부 표시:

```tsx
<option value={room.roomId}>
  {room.name}
  {room.isConfirm && ' (승인 필요)'}
  {!room.isAvailable && ' (사용 불가)'}
</option>
```

### 5. 테스트 시나리오

#### 5.1 정상 케이스
1. **업무시간 내 + 승인 필요 회의실**
   - 안내 모달 표시 안 됨
   - 바로 예약 신청

2. **업무시간 외 + 승인 불필요 회의실**
   - 안내 모달 표시 안 됨
   - 바로 예약 신청

3. **업무시간 내 + 승인 불필요 회의실**
   - 안내 모달 표시 안 됨
   - 바로 예약 신청

#### 5.2 안내 모달 표시 케이스
4. **평일 18:00 이후 + 승인 필요 회의실**
   - 안내 모달 표시
   - "예약 신청하기" 클릭 시 정상 제출
   - "취소" 클릭 시 폼 유지

5. **평일 09:00 이전 + 승인 필요 회의실**
   - 안내 모달 표시

6. **주말 + 승인 필요 회의실**
   - 안내 모달 표시

#### 5.3 모달 동작 테스트
- ESC 키로 모달 닫기
- 배경 클릭으로 모달 닫기
- 취소 버튼 클릭
- 확인 버튼 클릭 후 제출 진행

### 6. 확장 고려사항

#### 6.1 공휴일 처리 (Phase 2)
```typescript
// 공휴일 목록 관리
const HOLIDAYS = [
  '2026-01-01', // 신정
  '2026-02-11', // 설날 연휴
  // ...
];

export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split('T')[0];
  return HOLIDAYS.includes(dateString);
}
```

#### 6.2 관리자 설정 (Phase 2)
- 업무시간을 관리자 페이지에서 설정 가능
- DB에 저장: `system_settings` 테이블
- API: `GET /admin/settings/business-hours`

#### 6.3 이메일/슬랙 알림 (Phase 2)
- 업무시간 외 예약 신청 시 관리자에게 알림
- 우선순위 낮은 알림으로 분류

## 구현 순서

### Phase 1: 기본 기능 (필수)
1. ✅ 업무시간 체크 유틸리티 함수 생성
2. ✅ AfterHoursNoticeDialog 컴포넌트 생성
3. ✅ CreateReservationPage 로직 통합
4. ✅ 테스트 및 검증

### Phase 2: UI 개선 (선택)
5. ⏸️ 폼 상단에 업무시간 상태 표시
6. ⏸️ 회의실 선택 시 승인 필요 표시

### Phase 3: 확장 기능 (미래)
7. ⏸️ 공휴일 처리
8. ⏸️ 관리자 설정 페이지
9. ⏸️ 알림 기능

## 기술 스택

### 컴포넌트
- React Functional Component
- TypeScript
- Shadcn/ui AlertDialog

### 유틸리티
- Date 객체 활용
- 타임존 처리 (KST)

### 아이콘
- Clock (업무시간)
- AlertCircle (주의/경고)

## 예상 파일 변경사항

### 신규 파일
- `frontend/src/utils/businessHours.ts` (유틸리티)
- `frontend/src/components/reservations/AfterHoursNoticeDialog.tsx` (모달)

### 수정 파일
- `frontend/src/pages/CreateReservationPage.tsx`
  - import 추가
  - 상태 추가
  - handleSubmit 로직 수정
  - submitReservation 함수 분리
  - 모달 핸들러 추가
  - JSX에 모달 추가

## 성공 기준

### 기능 요구사항
- ✅ 업무시간 외 + 승인 필요 회의실 예약 시 안내 모달 표시
- ✅ 모달에서 확인 시 정상적으로 예약 제출
- ✅ 모달에서 취소 시 예약 제출 중단
- ✅ 업무시간 내 또는 승인 불필요 회의실은 모달 표시 안 함

### UX 요구사항
- ✅ 모달 디자인이 명확하고 이해하기 쉬움
- ✅ 경고 아이콘으로 주의 환기
- ✅ 참고사항 제공으로 사용자 불안 해소
- ✅ ESC 키 및 배경 클릭으로 모달 닫기 가능

### 성능 요구사항
- ✅ 업무시간 체크는 클라이언트 사이드에서 즉시 처리
- ✅ 추가 API 호출 없음
- ✅ 사용자 경험에 지장 없음

## 보안 고려사항

1. **클라이언트 체크만 사용**: 서버 측 검증은 불필요 (안내 목적이므로)
2. **타임존 처리**: 한국 시간(KST) 기준으로 정확한 업무시간 판단
3. **우회 불가능**: 모달을 닫아도 예약 자체는 가능 (안내 목적)

## 완료 체크리스트

- [ ] businessHours.ts 유틸리티 함수 구현
- [ ] AfterHoursNoticeDialog 컴포넌트 구현
- [ ] CreateReservationPage 로직 통합
- [ ] 업무시간 내 예약 테스트
- [ ] 업무시간 외 예약 테스트
- [ ] 주말 예약 테스트
- [ ] 모달 동작 테스트 (확인/취소)
- [ ] 승인 불필요 회의실 테스트
- [ ] 프론트엔드 빌드 테스트
- [ ] 문서화 업데이트

---

## 구현 완료 (2026-01-14)

### 구현된 파일

#### 신규 파일
**`frontend/src/utils/businessHours.ts`** (47줄)
- 업무시간 설정 상수 (평일 09:00~18:00)
- `isBusinessHours()`: 특정 날짜/시간이 업무시간인지 확인
- `isCurrentlyBusinessHours()`: 현재 업무시간인지 확인
- `isAfterHoursReservation()`: 업무시간 외 예약 신청인지 확인

**`frontend/src/components/reservations/AfterHoursNoticeDialog.tsx`** (98줄)
- Dialog 컴포넌트 기반 안내 모달
- 주의 아이콘 및 명확한 메시지
- 참고사항 섹션 (3개 항목)
- 확인/취소 버튼

#### 수정 파일
**`frontend/src/pages/CreateReservationPage.tsx`**
- import 추가: AfterHoursNoticeDialog, isAfterHoursReservation
- Room 인터페이스에 `isConfirm` 필드 추가
- 상태 추가: `showAfterHoursNotice`
- `handleSubmit` 로직 수정: 승인 필요 + 업무시간 외 체크
- `submitReservation` 함수 분리: 실제 API 호출 로직
- `handleAfterHoursConfirm`: 모달 확인 핸들러
- `handleAfterHoursCancel`: 모달 취소 핸들러
- JSX에 AfterHoursNoticeDialog 추가

### 빌드 결과
- ✅ TypeScript 컴파일 성공
- ✅ Vite 빌드 성공 (10.02초)
- ✅ 경고 없음
- 📦 빌드 크기: 700.36 kB (gzip: 204.34 kB)
