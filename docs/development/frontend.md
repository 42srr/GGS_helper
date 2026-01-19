# 프론트엔드 구조

GGS Helper 프론트엔드의 구조와 개발 가이드입니다.

## 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [컴포넌트 구조](#컴포넌트-구조)
- [상태 관리](#상태-관리)
- [라우팅](#라우팅)
- [API 통신](#api-통신)
- [스타일링](#스타일링)
- [타입 정의](#타입-정의)

## 기술 스택

| 카테고리 | 기술 | 버전 | 용도 |
|---------|------|------|------|
| **UI 라이브러리** | React | 18.x | UI 렌더링 |
| **빌드 도구** | Vite | 5.x | 개발 서버 & 빌드 |
| **언어** | TypeScript | 5.x | 타입 안정성 |
| **라우팅** | React Router | 6.x | SPA 라우팅 |
| **상태 관리** | Context API | - | 인증 상태 |
| **UI 컴포넌트** | Shadcn/ui | - | 재사용 컴포넌트 |
| **스타일링** | Tailwind CSS | 3.x | 유틸리티 CSS |
| **알림** | Sonner | - | Toast 알림 |
| **HTTP 클라이언트** | Fetch API | - | API 통신 |

## 프로젝트 구조

```
frontend/
├── public/                     # 정적 파일
│   └── uploads/               # 업로드 파일 (개발 환경)
│
├── src/
│   ├── components/            # React 컴포넌트
│   │   ├── ui/               # 재사용 가능한 UI 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   ├── responsive-table.tsx
│   │   │   ├── visually-hidden.tsx
│   │   │   └── ...
│   │   ├── layout/           # 레이아웃 컴포넌트
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Footer.tsx
│   │   ├── calendar/         # 캘린더 관련
│   │   │   ├── TimelineCalendar.tsx
│   │   │   └── ReservationModal.tsx
│   │   └── ErrorBoundary.tsx # 에러 경계
│   │
│   ├── pages/                # 페이지 컴포넌트
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ReservationsPage.tsx
│   │   ├── MyReservationsPage.tsx
│   │   ├── PublicReservationsPage.tsx
│   │   └── admin/            # 관리자 페이지
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminReservationsPage.tsx
│   │       ├── AdminRoomsPage.tsx
│   │       ├── AdminUsersPage.tsx
│   │       └── AdminStatisticsPage.tsx
│   │
│   ├── contexts/             # React Context
│   │   └── AuthContext.tsx  # 인증 상태 관리
│   │
│   ├── services/             # API 서비스 레이어
│   │   └── api.ts           # 중앙화된 API 서비스
│   │
│   ├── types/                # TypeScript 타입 정의
│   │   └── calendar.ts      # 캘린더 타입
│   │
│   ├── lib/                  # 유틸리티 함수
│   │   └── utils.ts         # 공통 유틸
│   │
│   ├── App.tsx               # 루트 컴포넌트
│   ├── main.tsx              # 엔트리 포인트
│   └── index.css             # 글로벌 스타일
│
├── .env                       # 환경변수
├── .env.example
├── package.json
├── tsconfig.json              # TypeScript 설정
├── vite.config.ts             # Vite 설정
├── tailwind.config.js         # Tailwind 설정
└── postcss.config.js          # PostCSS 설정
```

## 컴포넌트 구조

### 컴포넌트 계층

```
App
 └── ErrorBoundary
      └── AuthProvider
           └── BrowserRouter
                ├── Toaster (Global)
                └── Routes
                     ├── Layout (Header + Navigation)
                     │    └── Page Content
                     └── Standalone Pages (Login, Register)
```

### UI 컴포넌트 (src/components/ui/)

Shadcn/ui 기반 재사용 가능한 컴포넌트:

**기본 컴포넌트:**
- `button.tsx` - 버튼
- `card.tsx` - 카드 레이아웃
- `dialog.tsx` - 모달 다이얼로그
- `input.tsx` - 입력 필드
- `label.tsx` - 레이블
- `select.tsx` - 셀렉트 박스
- `table.tsx` - 테이블
- `badge.tsx` - 뱃지

**커스텀 컴포넌트:**
- `responsive-table.tsx` - 모바일 반응형 테이블
- `visually-hidden.tsx` - 스크린 리더 전용

사용 예시:

```tsx
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>제목</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => console.log('clicked')}>
          클릭
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 레이아웃 컴포넌트 (src/components/layout/)

**Header.tsx:**
- 로고 및 사이트 제목
- 사용자 정보 표시
- 로그아웃 버튼

**Navigation.tsx:**
- 사용자 역할 기반 메뉴
- 현재 페이지 하이라이트

예시:

```tsx
// Navigation.tsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Navigation() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav>
      <Link
        to="/reservations"
        className={location.pathname === '/reservations' ? 'active' : ''}
      >
        예약 현황
      </Link>

      {user?.role === 'admin' && (
        <Link to="/admin">관리자</Link>
      )}
    </nav>
  );
}
```

### 페이지 컴포넌트 (src/pages/)

각 페이지는 독립적인 컴포넌트:

**구조:**

```tsx
// MyReservationsPage.tsx
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Reservation } from '@/types/calendar';

export function MyReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const data = await api.get<Reservation[]>('/reservations/my');
      setReservations(data);
    } catch (error) {
      console.error('Failed to load reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>내 예약</h1>
      {/* Render reservations */}
    </div>
  );
}
```

## 상태 관리

### AuthContext (인증 상태)

전역 인증 상태를 관리합니다.

**파일:** `src/contexts/AuthContext.tsx`

**제공하는 값:**

```typescript
interface AuthContextType {
  user: User | null;              // 현재 사용자
  loading: boolean;               // 로딩 상태
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}
```

**사용 예시:**

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, logout } = useAuth();

  if (!user) {
    return <div>로그인이 필요합니다</div>;
  }

  return (
    <div>
      <p>환영합니다, {user.name}님</p>
      <button onClick={logout}>로그아웃</button>
    </div>
  );
}
```

### 로컬 상태 (useState)

컴포넌트 내부 상태는 `useState` 사용:

```tsx
const [data, setData] = useState<DataType[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

## 라우팅

### React Router v6

**파일:** `src/App.tsx`

```tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/public-reservations" element={<PublicReservationsPage />} />

        {/* Protected routes */}
        <Route
          path="/reservations"
          element={
            <ProtectedRoute>
              <ReservationsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        />

        <Route path="/" element={<Navigate to="/reservations" />} />
      </Routes>
    </Router>
  );
}
```

### Protected Route

인증된 사용자만 접근 가능:

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

### Admin Route

관리자만 접근 가능:

```tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/reservations" />;
  }

  return <>{children}</>;
}
```

## API 통신

### 중앙화된 API 서비스

**파일:** `src/services/api.ts`

```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  post: async <T>(endpoint: string, data?: any): Promise<T> => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  },

  // patch, delete, uploadFile 메서드도 유사하게 구현
};
```

### 사용 예시

```tsx
import { api } from '@/services/api';

// GET 요청
const reservations = await api.get<Reservation[]>('/reservations/my');

// POST 요청
const newReservation = await api.post<Reservation>('/reservations', {
  roomId: 1,
  title: '팀 회의',
  startTime: '2024-01-20T14:00:00Z',
  endTime: '2024-01-20T16:00:00Z',
});

// 파일 업로드
const formData = new FormData();
formData.append('photo', file);
await api.uploadFile(`/reservations/${id}/checkout`, formData);
```

## 스타일링

### Tailwind CSS

유틸리티 클래스 기반 스타일링:

```tsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  <h2 className="text-xl font-bold text-gray-900">제목</h2>
  <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    버튼
  </button>
</div>
```

### Shadcn/ui 테마

`src/index.css`에서 CSS 변수로 테마 정의:

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... */
  }
}
```

### 반응형 디자인

Tailwind의 반응형 접두사 사용:

```tsx
<div className="
  flex flex-col gap-4        // 모바일: 세로 배치
  md:flex-row md:gap-6       // 태블릿: 가로 배치
  lg:gap-8                   // 데스크톱: 더 넓은 간격
">
  {/* content */}
</div>
```

### 유틸리티 함수

`src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind 클래스 병합 (충돌 방지)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

사용 예시:

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  'base-class',
  isActive && 'active-class',
  className // props로 받은 className
)} />
```

## 타입 정의

### 공통 타입 (src/types/calendar.ts)

```typescript
export type ViewMode = 'day' | 'week' | 'month';

export type Room = {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment?: string;
  isAvailable: boolean;
};

export type Reservation = {
  reservationId: number;
  roomId: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: 'confirmed' | 'pending' | 'cancelled' | 'in_progress' | 'awaiting_checkout' | 'finished';
  room?: Room;
  user?: {
    userId: number;
    name: string;
    email?: string;
  };
};
```

### 컴포넌트 Props 타입

```typescript
interface MyComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
  className?: string;
  children?: React.ReactNode;
}

export function MyComponent({ title, onSubmit, className, children }: MyComponentProps) {
  // ...
}
```

## 에러 처리

### ErrorBoundary

React 에러를 전역에서 처리:

```tsx
// src/components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>오류가 발생했습니다</h1>
          <button onClick={this.handleReset}>홈으로 돌아가기</button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Toast 알림

Sonner를 사용한 사용자 피드백:

```tsx
import { toast } from 'sonner';

// 성공 알림
toast.success('예약이 생성되었습니다');

// 에러 알림
toast.error('예약 생성에 실패했습니다');

// 정보 알림
toast.info('예약 시간을 확인해주세요');
```

## 개발 워크플로우

### 개발 서버 실행

```bash
cd frontend
npm run dev
```

브라우저에서 [http://localhost:6111](http://localhost:6111) 접속.

### 프로덕션 빌드

```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

### 타입 체크

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## 다음 단계

- [API 가이드](./api-guide.md) - API 엔드포인트
- [코딩 스타일 가이드](./coding-style.md) - 코드 컨벤션
- [시스템 아키텍처](./architecture.md) - 전체 시스템 구조
