# 캘린더 타임라인 뷰 구현 계획서

## 📋 문서 정보
- **작성일**: 2026-01-12
- **기능명**: 타임라인 뷰 캘린더 (Timeline View Calendar)
- **우선순위**: High
- **예상 소요 기간**: 2-3주

---

## 🎯 목표

회의실 예약 현황을 **시간대별 × 회의실별** 그리드로 시각화하여 사용자가 한눈에 예약 가능 여부를 파악할 수 있도록 개선

### 핵심 가치
1. **직관성**: 시간대와 회의실을 2차원 그리드로 표현
2. **효율성**: 빈 시간대를 즉시 파악하여 예약 시간 단축
3. **명확성**: 회의실별 색상 구분으로 혼동 방지
4. **실시간성**: 현재 진행 중인 예약 강조 표시

---

## 📐 UI/UX 설계

### 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Header                                                       │
├─────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 🗓️ 2026년 1월 12일 (일)          [오늘] [◀ ▶]         │  │
│ │ View: ○ 일간  ● 주간  ○ 월간                          │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─────┬───────────────────────────────────────────────┐    │
│ │시간  │ 09:00  10:00  11:00  12:00  13:00  14:00... │    │
│ ├─────┼───────────────────────────────────────────────┤    │
│ │회의실A│ ████████████░░░░░░░░░░░░████████░░░░░░░░    │    │
│ │ 4인  │ 프로젝트 회의  (비어있음)  스터디          │    │
│ │ 🟦  │                                               │    │
│ ├─────┼───────────────────────────────────────────────┤    │
│ │회의실B│ ░░░░░░░░████████████████████████░░░░░░░░    │    │
│ │ 8인  │ (비어있음)  전체 회의                         │    │
│ │ 🟪  │                                               │    │
│ ├─────┼───────────────────────────────────────────────┤    │
│ │회의실C│ ████░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░    │    │
│ │ 2인  │ 1:1  (비어있음)        면접                  │    │
│ │ 🟩  │                                               │    │
│ └─────┴───────────────────────────────────────────────┘    │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📊 실시간 통계                                       │    │
│ │ • 총 예약: 12건  • 사용 중: 3건  • 사용률: 68%      │    │
│ └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 화면별 상세 설계

#### 1. 일간 뷰 (Daily View)
- **시간 범위**: 09:00 ~ 21:00 (12시간)
- **시간 간격**: 30분 단위 그리드
- **세로축**: 모든 회의실 나열
- **가로축**: 시간대 (30분 단위)

#### 2. 주간 뷰 (Weekly View)
- **날짜 범위**: 월~일 (7일)
- **시간 범위**: 09:00 ~ 21:00
- **레이아웃**: 날짜별 탭 또는 가로 스크롤
- **컴팩트 모드**: 시간대를 1시간 단위로 압축

#### 3. 월간 뷰 (Monthly View)
- 기존 월간 캘린더 유지
- 각 날짜 셀에 예약 개수를 도트로 표시
- 클릭 시 해당 날짜의 일간 뷰로 전환

---

## 🎨 디자인 시스템

### 색상 팔레트

#### 회의실별 색상
```typescript
const ROOM_COLORS = {
  // Primary colors (회의실 구분)
  room1: {
    light: '#DBEAFE',    // blue-100
    base: '#3B82F6',     // blue-500
    dark: '#1E3A8A',     // blue-900
    border: '#60A5FA',   // blue-400
  },
  room2: {
    light: '#E9D5FF',    // purple-100
    base: '#A855F7',     // purple-500
    dark: '#581C87',     // purple-900
    border: '#C084FC',   // purple-400
  },
  room3: {
    light: '#D1FAE5',    // green-100
    base: '#10B981',     // green-500
    dark: '#064E3B',     // green-900
    border: '#34D399',   // green-400
  },
  room4: {
    light: '#FED7AA',    // orange-100
    base: '#F97316',     // orange-500
    dark: '#7C2D12',     // orange-900
    border: '#FB923C',   // orange-400
  },
  room5: {
    light: '#FCE7F3',    // pink-100
    base: '#EC4899',     // pink-500
    dark: '#831843',     // pink-900
    border: '#F472B6',   // pink-400
  },
};
```

#### 예약 상태별 표시
```typescript
const STATUS_STYLES = {
  confirmed: {
    opacity: '100%',
    icon: '✓',
    label: '확정',
  },
  pending: {
    opacity: '60%',
    icon: '⏳',
    label: '승인 대기',
    pattern: 'diagonal-stripes', // 대각선 패턴
  },
  in_progress: {
    opacity: '100%',
    icon: '▶',
    label: '진행 중',
    animation: 'pulse',
  },
  cancelled: {
    opacity: '30%',
    icon: '✗',
    label: '취소됨',
    decoration: 'line-through',
  },
};
```

#### 시간대별 배경색
```typescript
const TIME_BACKGROUND = {
  working_hours: '#FFFFFF',     // 09:00-18:00 (근무 시간)
  extended_hours: '#F9FAFB',    // 18:00-21:00 (연장 시간)
  current_time: '#FEF3C7',      // 현재 시간 열 강조
  past_time: '#F3F4F6',         // 지나간 시간
};
```

### 타이포그래피

```css
/* 회의실 이름 */
.room-name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
}

/* 예약 제목 */
.reservation-title {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 시간 표시 */
.time-label {
  font-size: 11px;
  font-weight: 400;
  color: #6B7280; /* gray-500 */
}

/* 통계 숫자 */
.stat-number {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}
```

---

## 🔧 기술 스택 및 의존성

### 새로 추가할 라이브러리

#### 1. react-big-calendar (선택 1 - 추천)
```bash
npm install react-big-calendar
npm install --save-dev @types/react-big-calendar
```
- **장점**: 타임라인 뷰 기본 제공, 커스터마이징 용이
- **단점**: 번들 크기 약간 큼 (~100KB)
- **라이선스**: MIT

#### 2. FullCalendar (선택 2)
```bash
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/resource-timeline
```
- **장점**: 강력한 기능, 상용 수준 UI
- **단점**: 리소스 타임라인은 유료 (무료 플랜 가능)
- **라이선스**: MIT (기본), Commercial (프리미엄)

#### 3. 커스텀 구현 (선택 3 - 추천)
- **장점**: 완전한 제어, 번들 최소화, 프로젝트 특화
- **단점**: 개발 시간 증가
- **의존성**: 기존 라이브러리만 사용 (lucide-react, date-fns)

**결정**: **선택 3 (커스텀 구현)** 추천
- 기존 디자인 시스템과 완벽한 통합
- 불필요한 기능 제거로 성능 최적화
- 프로젝트 요구사항에 정확히 맞춤

### 유틸리티 라이브러리

```bash
npm install date-fns  # 이미 설치되어 있을 가능성 높음
```
- 날짜 계산 및 포맷팅
- 타임존 처리

---

## 📂 파일 구조

```
frontend/src/
├── components/
│   ├── calendar/
│   │   ├── Calendar.tsx                    # (기존) 월간 캘린더
│   │   ├── TimelineCalendar.tsx            # (신규) 타임라인 메인 컴포넌트
│   │   ├── TimelineHeader.tsx              # (신규) 헤더 (날짜, 뷰 전환)
│   │   ├── TimelineGrid.tsx                # (신규) 그리드 레이아웃
│   │   ├── TimelineRoomRow.tsx             # (신규) 회의실별 행
│   │   ├── TimelineReservationBlock.tsx    # (신규) 예약 블록
│   │   ├── TimelineTimeScale.tsx           # (신규) 시간 축
│   │   ├── TimelineCurrentTimeIndicator.tsx # (신규) 현재 시간 표시선
│   │   └── TimelineStatsPanel.tsx          # (신규) 통계 패널
│   ├── reservations/
│   │   ├── ReservationFilters.tsx          # (기존)
│   │   ├── ReservationDetailModal.tsx      # (기존)
│   │   └── QuickReservationModal.tsx       # (신규) 빠른 예약 생성
│   └── ui/
│       └── (기존 shadcn/ui 컴포넌트)
├── pages/
│   ├── ReservationsPage.tsx                # (수정) 타임라인 뷰 추가
│   └── ...
├── hooks/
│   ├── useTimelineCalendar.ts              # (신규) 타임라인 로직
│   ├── useReservationSlots.ts              # (신규) 예약 슬롯 계산
│   └── useCurrentTime.ts                   # (신규) 실시간 시간 업데이트
├── utils/
│   ├── calendar/
│   │   ├── timeSlots.ts                    # (신규) 시간 슬롯 계산
│   │   ├── reservationLayout.ts            # (신규) 예약 배치 알고리즘
│   │   └── roomColors.ts                   # (신규) 회의실 색상 매핑
│   └── ...
└── types/
    ├── calendar.ts                          # (신규) 타임라인 타입 정의
    └── ...
```

---

## 🔨 구현 계획

### Phase 1: 기본 구조 (1주차)

#### 1.1 데이터 모델 및 타입 정의
**파일**: `frontend/src/types/calendar.ts`

```typescript
export type ViewMode = 'day' | 'week' | 'month';

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
}

export interface RoomWithReservations {
  room: Room;
  reservations: Reservation[];
  availability: TimeSlot[];
}

export interface TimelineConfig {
  viewMode: ViewMode;
  startHour: number;  // 09
  endHour: number;    // 21
  slotDuration: number; // 30 (minutes)
  showWeekends: boolean;
}
```

#### 1.2 타임라인 그리드 컴포넌트
**파일**: `frontend/src/components/calendar/TimelineGrid.tsx`

```typescript
interface TimelineGridProps {
  config: TimelineConfig;
  rooms: RoomWithReservations[];
  selectedDate: Date;
  onSlotClick?: (room: Room, timeSlot: TimeSlot) => void;
}

export function TimelineGrid({ config, rooms, selectedDate, onSlotClick }: TimelineGridProps) {
  // 1. 시간 슬롯 생성 (09:00 ~ 21:00, 30분 단위)
  // 2. 각 회의실별 행 렌더링
  // 3. 예약 블록 배치
  // 4. 빈 슬롯 클릭 이벤트 처리
}
```

#### 1.3 시간 축 컴포넌트
**파일**: `frontend/src/components/calendar/TimelineTimeScale.tsx`

```typescript
export function TimelineTimeScale({ startHour, endHour, slotDuration }: TimeScaleProps) {
  // 09:00, 09:30, 10:00, ... 21:00 레이블 생성
  // 현재 시간 표시선 위치 계산
}
```

**체크리스트**:
- [ ] 타입 정의 완료
- [ ] 시간 슬롯 계산 유틸리티 작성
- [ ] 기본 그리드 레이아웃 구현
- [ ] 시간 축 레이블 렌더링

---

### Phase 2: 예약 블록 렌더링 (1주차)

#### 2.1 예약 블록 컴포넌트
**파일**: `frontend/src/components/calendar/TimelineReservationBlock.tsx`

```typescript
interface ReservationBlockProps {
  reservation: Reservation;
  roomColor: RoomColor;
  timeSlotWidth: number; // CSS 단위 (px, %)
  onClick?: () => void;
}

export function TimelineReservationBlock({ reservation, roomColor, timeSlotWidth, onClick }: ReservationBlockProps) {
  const duration = calculateDuration(reservation.startTime, reservation.endTime);
  const width = (duration / 30) * timeSlotWidth; // 30분 기준

  return (
    <div
      className={cn(
        'absolute rounded-md border-l-4 px-2 py-1 cursor-pointer',
        'hover:shadow-lg transition-shadow',
        roomColor.bg,
        roomColor.border
      )}
      style={{ width: `${width}px` }}
      onClick={onClick}
    >
      <div className="text-xs font-medium truncate">{reservation.title}</div>
      <div className="text-xs opacity-75">{formatTimeRange(reservation)}</div>
    </div>
  );
}
```

#### 2.2 예약 배치 알고리즘
**파일**: `frontend/src/utils/calendar/reservationLayout.ts`

```typescript
/**
 * 겹치는 예약들을 Y축으로 배치
 * 같은 시간대에 여러 예약이 있는 경우 세로로 쌓기
 */
export function calculateReservationPositions(reservations: Reservation[]): LayoutPosition[] {
  // 1. 시작 시간 순으로 정렬
  // 2. 겹치는 예약 그룹 찾기
  // 3. 각 그룹 내에서 Y 좌표 계산
  // 4. { reservation, x, y, width, height } 반환
}
```

**체크리스트**:
- [ ] 예약 블록 UI 구현
- [ ] 시간에 따른 너비 계산
- [ ] 회의실 색상 적용
- [ ] Hover 효과 및 툴팁
- [ ] 겹침 방지 레이아웃 알고리즘

---

### Phase 3: 인터랙션 및 UX (2주차)

#### 3.1 현재 시간 표시선
**파일**: `frontend/src/components/calendar/TimelineCurrentTimeIndicator.tsx`

```typescript
export function TimelineCurrentTimeIndicator({ currentTime, startHour, endHour }: IndicatorProps) {
  const position = calculateTimePosition(currentTime, startHour, endHour);

  return (
    <div
      className="absolute w-px bg-red-500 z-10"
      style={{ left: `${position}%` }}
    >
      <div className="absolute -top-2 -left-3 w-6 h-6 bg-red-500 rounded-full" />
      <div className="absolute top-0 w-px h-full bg-red-500" />
    </div>
  );
}

// 1초마다 위치 업데이트
useEffect(() => {
  const interval = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // 1분마다

  return () => clearInterval(interval);
}, []);
```

#### 3.2 빠른 예약 생성
**기능**: 빈 슬롯 클릭 시 모달 오픈

```typescript
const handleEmptySlotClick = (room: Room, timeSlot: TimeSlot) => {
  setQuickReservation({
    roomId: room.roomId,
    startTime: timeSlot.startTime,
    endTime: timeSlot.endTime,
  });
  setQuickReservationModalOpen(true);
};
```

#### 3.3 예약 상세 모달
**기능**: 예약 블록 클릭 시 상세 정보 표시 (기존 모달 재사용)

```typescript
const handleReservationClick = (reservation: Reservation) => {
  setSelectedReservation(reservation);
  setDetailModalOpen(true);
};
```

**체크리스트**:
- [ ] 현재 시간 표시선 구현
- [ ] 실시간 업데이트 (1분마다)
- [ ] 빈 슬롯 클릭 이벤트
- [ ] 빠른 예약 모달 구현
- [ ] 예약 상세 모달 연동

---

### Phase 4: 뷰 전환 및 필터링 (2주차)

#### 4.1 뷰 모드 전환
**파일**: `frontend/src/components/calendar/TimelineHeader.tsx`

```typescript
export function TimelineHeader({ viewMode, onViewModeChange, selectedDate, onDateChange }: HeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold">
          {formatDate(selectedDate, viewMode)}
        </h2>
        <div className="flex gap-2">
          <Button onClick={() => onDateChange(addDays(selectedDate, -1))}>
            <ChevronLeft />
          </Button>
          <Button onClick={() => onDateChange(new Date())}>
            오늘
          </Button>
          <Button onClick={() => onDateChange(addDays(selectedDate, 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['day', 'week', 'month'] as ViewMode[]).map(mode => (
          <Button
            key={mode}
            variant={viewMode === mode ? 'default' : 'outline'}
            onClick={() => onViewModeChange(mode)}
          >
            {mode === 'day' ? '일간' : mode === 'week' ? '주간' : '월간'}
          </Button>
        ))}
      </div>
    </div>
  );
}
```

#### 4.2 회의실 필터링
**기능**: 특정 회의실만 표시/숨김

```typescript
const [visibleRooms, setVisibleRooms] = useState<number[]>(
  rooms.map(r => r.roomId)
);

const toggleRoomVisibility = (roomId: number) => {
  setVisibleRooms(prev =>
    prev.includes(roomId)
      ? prev.filter(id => id !== roomId)
      : [...prev, roomId]
  );
};
```

**체크리스트**:
- [ ] 일간/주간/월간 뷰 전환
- [ ] 날짜 네비게이션 (이전/다음/오늘)
- [ ] 회의실 필터 토글
- [ ] 필터 상태 URL 동기화 (선택)

---

### Phase 5: 성능 최적화 및 반응형 (3주차)

#### 5.1 가상화 (Virtualization)
**대상**: 회의실 수가 많을 때 (10개 이상)

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const rowVirtualizer = useVirtualizer({
  count: rooms.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // 각 행 높이
  overscan: 5,
});
```

#### 5.2 메모이제이션
```typescript
const timeSlots = useMemo(() =>
  generateTimeSlots(config.startHour, config.endHour, config.slotDuration),
  [config]
);

const reservationPositions = useMemo(() =>
  calculateReservationPositions(reservations),
  [reservations]
);
```

#### 5.3 반응형 디자인
```css
/* Mobile (< 768px) */
@media (max-width: 768px) {
  /* 회의실 이름 축약 */
  /* 시간 레이블 회전 */
  /* 세로 스크롤 활성화 */
}

/* Tablet (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  /* 시간 간격 1시간 단위로 변경 */
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  /* 30분 단위 표시 */
  /* 사이드 패널 표시 */
}
```

**체크리스트**:
- [ ] 대량 데이터 가상화
- [ ] 계산 결과 메모이제이션
- [ ] 불필요한 리렌더링 방지
- [ ] 모바일 반응형 레이아웃
- [ ] 터치 제스처 지원 (스와이프)

---

### Phase 6: 통계 및 추가 기능 (3주차)

#### 6.1 실시간 통계 패널
**파일**: `frontend/src/components/calendar/TimelineStatsPanel.tsx`

```typescript
export function TimelineStatsPanel({ reservations, rooms, selectedDate }: StatsPanelProps) {
  const stats = useMemo(() => ({
    total: reservations.length,
    inProgress: reservations.filter(isInProgress).length,
    upcoming: reservations.filter(isUpcoming).length,
    utilizationRate: calculateUtilizationRate(reservations, rooms),
  }), [reservations, rooms]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>📊 실시간 통계</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <StatItem label="총 예약" value={stats.total} />
        <StatItem label="진행 중" value={stats.inProgress} icon="▶" />
        <StatItem label="예정" value={stats.upcoming} icon="⏳" />
        <StatItem label="사용률" value={`${stats.utilizationRate}%`} />
      </CardContent>
    </Card>
  );
}
```

#### 6.2 키보드 단축키
```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') navigateToPrevious();
    if (e.key === 'ArrowRight') navigateToNext();
    if (e.key === 't' || e.key === 'T') goToToday();
    if (e.key === 'd' || e.key === 'D') setViewMode('day');
    if (e.key === 'w' || e.key === 'W') setViewMode('week');
    if (e.key === 'm' || e.key === 'M') setViewMode('month');
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

**체크리스트**:
- [ ] 실시간 통계 패널 구현
- [ ] 사용률 계산 로직
- [ ] 키보드 단축키
- [ ] 접근성 (ARIA) 개선
- [ ] 로딩 스켈레톤 UI

---

## 🧪 테스트 계획

### 단위 테스트

```typescript
// timeSlots.test.ts
describe('generateTimeSlots', () => {
  it('should generate 30-minute slots from 9 to 21', () => {
    const slots = generateTimeSlots(9, 21, 30);
    expect(slots).toHaveLength(24); // 12시간 × 2 (30분 단위)
    expect(slots[0].startTime.getHours()).toBe(9);
    expect(slots[slots.length - 1].endTime.getHours()).toBe(21);
  });
});

// reservationLayout.test.ts
describe('calculateReservationPositions', () => {
  it('should not overlap reservations', () => {
    const reservations = [
      { startTime: new Date('2026-01-12 09:00'), endTime: new Date('2026-01-12 10:00') },
      { startTime: new Date('2026-01-12 09:30'), endTime: new Date('2026-01-12 10:30') },
    ];

    const positions = calculateReservationPositions(reservations);
    expect(positions[0].y).not.toBe(positions[1].y); // 다른 Y 좌표
  });
});
```

### 통합 테스트

```typescript
// TimelineCalendar.test.tsx
describe('TimelineCalendar', () => {
  it('should render all rooms', () => {
    render(<TimelineCalendar rooms={mockRooms} reservations={[]} />);
    expect(screen.getByText('회의실 A')).toBeInTheDocument();
    expect(screen.getByText('회의실 B')).toBeInTheDocument();
  });

  it('should switch view modes', () => {
    render(<TimelineCalendar />);
    fireEvent.click(screen.getByText('주간'));
    expect(screen.getByText('월요일')).toBeInTheDocument();
  });
});
```

### E2E 테스트 (Playwright)

```typescript
test('사용자가 빈 슬롯을 클릭하여 예약을 생성할 수 있다', async ({ page }) => {
  await page.goto('/reservations');
  await page.click('[data-testid="empty-slot-9-00"]');
  await expect(page.locator('[data-testid="quick-reservation-modal"]')).toBeVisible();
  await page.fill('[name="title"]', '팀 회의');
  await page.click('button:has-text("예약 생성")');
  await expect(page.locator('text=예약이 생성되었습니다')).toBeVisible();
});
```

---

## 📊 성능 목표

### 렌더링 성능
- **초기 로딩**: < 500ms
- **뷰 전환**: < 200ms
- **스크롤 FPS**: 60fps
- **인터랙션 응답**: < 100ms

### 번들 크기
- **타임라인 컴포넌트**: < 50KB (gzip)
- **전체 증가분**: < 100KB

### 메모리 사용
- **초기 메모리**: < 10MB
- **최대 메모리**: < 50MB (100개 예약 기준)

---

## 🚀 배포 계획

### 단계별 배포

#### Stage 1: 베타 테스트
- **대상**: GGS 동아리 멤버 (내부)
- **기간**: 3일
- **목적**: 버그 발견 및 UX 피드백

#### Stage 2: 소프트 런칭
- **대상**: 42경산 일부 사용자
- **기간**: 1주
- **방법**: Feature Flag로 제어

```typescript
const ENABLE_TIMELINE_VIEW = import.meta.env.VITE_ENABLE_TIMELINE_VIEW === 'true';

{ENABLE_TIMELINE_VIEW && (
  <Button onClick={() => setView('timeline')}>
    타임라인 뷰
  </Button>
)}
```

#### Stage 3: 전체 공개
- **조건**:
  - 주요 버그 0건
  - 사용자 만족도 > 4.0/5.0
- **공지**: 프론트엔드 배너, 슬랙 공지

### 롤백 계획
- Git 이전 버전으로 즉시 복구 가능
- Feature Flag로 신규 기능 비활성화

---

## 📝 마이그레이션 가이드

### 기존 사용자 대응

#### 1. 기존 캘린더 유지
- 월간 뷰는 기존 Calendar 컴포넌트 사용
- 타임라인 뷰는 새로운 선택지로 제공

#### 2. 뷰 전환 UI
```typescript
<Tabs value={calendarView} onValueChange={setCalendarView}>
  <TabsList>
    <TabsTrigger value="monthly">월간 캘린더</TabsTrigger>
    <TabsTrigger value="timeline">타임라인 뷰 ✨ New</TabsTrigger>
  </TabsList>

  <TabsContent value="monthly">
    <Calendar {...props} />
  </TabsContent>

  <TabsContent value="timeline">
    <TimelineCalendar {...props} />
  </TabsContent>
</Tabs>
```

#### 3. 사용자 선호 저장
```typescript
// localStorage에 뷰 선호도 저장
useEffect(() => {
  const savedView = localStorage.getItem('preferred-calendar-view');
  if (savedView) setCalendarView(savedView as CalendarView);
}, []);

useEffect(() => {
  localStorage.setItem('preferred-calendar-view', calendarView);
}, [calendarView]);
```

---

## 🐛 예상 이슈 및 해결 방안

### 이슈 1: 대량 예약 시 렌더링 느림
**원인**: 많은 DOM 노드 생성
**해결**:
- 가상화 적용 (`@tanstack/react-virtual`)
- 뷰포트 밖 예약은 렌더링 생략

### 이슈 2: 시간대가 긴 예약 (4시간 이상)
**원인**: 블록이 너무 넓어서 레이아웃 깨짐
**해결**:
- 최대 너비 제한
- 스크롤 가능한 컨테이너

### 이슈 3: 겹치는 예약 배치
**원인**: Y축 공간 부족
**해결**:
- 행 높이 동적 조정
- "더보기" 버튼으로 숨김

### 이슈 4: 모바일에서 터치 조작 어려움
**원인**: 작은 화면에 많은 정보
**해결**:
- 모바일에서는 1시간 단위로 변경
- 세로 스크롤 우선 레이아웃

---

## 📚 참고 자료

### 유사 서비스 벤치마킹
1. **Google Calendar** - 타임라인 뷰 UX
2. **Microsoft Outlook** - 회의실 예약 시스템
3. **Calendly** - 시간 슬롯 선택 인터페이스
4. **Notion Calendar** - 미니멀 디자인

### 기술 문서
- [React Big Calendar Docs](https://jquense.github.io/react-big-calendar/)
- [FullCalendar Docs](https://fullcalendar.io/docs)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [date-fns Documentation](https://date-fns.org/)

---

## ✅ 체크리스트 요약

### 개발 전 준비
- [ ] 기획 검토 및 승인
- [ ] 디자인 시스템 확정
- [ ] 기술 스택 결정 (커스텀 vs 라이브러리)
- [ ] 개발 환경 세팅

### Phase 1 (1주차)
- [ ] 타입 정의 및 데이터 모델
- [ ] 기본 그리드 레이아웃
- [ ] 시간 슬롯 계산 유틸리티

### Phase 2 (1주차)
- [ ] 예약 블록 UI 구현
- [ ] 회의실 색상 시스템
- [ ] 배치 알고리즘

### Phase 3 (2주차)
- [ ] 현재 시간 표시선
- [ ] 클릭 인터랙션
- [ ] 빠른 예약 모달

### Phase 4 (2주차)
- [ ] 뷰 모드 전환
- [ ] 필터링 기능
- [ ] 날짜 네비게이션

### Phase 5 (3주차)
- [ ] 성능 최적화
- [ ] 반응형 디자인
- [ ] 접근성 개선

### Phase 6 (3주차)
- [ ] 통계 패널
- [ ] 키보드 단축키
- [ ] 최종 테스트

### 배포
- [ ] 베타 테스트
- [ ] 소프트 런칭
- [ ] 전체 공개

---

## 📞 문의 및 피드백

**담당자**: GGS 프론트엔드 팀 (yutsong, kjung)
**슬랙 채널**: #ggs-helper-dev
**이슈 트래커**: GitHub Issues

---

**문서 버전**: 1.0.0
**최종 수정일**: 2026-01-12
**다음 리뷰 예정일**: Phase 1 완료 후
