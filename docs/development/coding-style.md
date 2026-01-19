# 코딩 스타일 가이드

GGS Helper 프로젝트의 코드 컨벤션과 베스트 프랙티스입니다.

## 목차

- [일반 원칙](#일반-원칙)
- [TypeScript 스타일](#typescript-스타일)
- [React 컴포넌트](#react-컴포넌트)
- [NestJS 백엔드](#nestjs-백엔드)
- [네이밍 컨벤션](#네이밍-컨벤션)
- [코멘트 작성](#코멘트-작성)
- [에러 처리](#에러-처리)
- [Git 커밋 메시지](#git-커밋-메시지)

## 일반 원칙

### 1. KISS (Keep It Simple, Stupid)

**나쁜 예:**

```typescript
const getUserReservations = (userId: number) => {
  const allReservations = getAllReservations();
  const filtered = allReservations.filter(r => r.userId === userId);
  const mapped = filtered.map(r => ({ ...r, formatted: true }));
  return mapped;
};
```

**좋은 예:**

```typescript
const getUserReservations = (userId: number) => {
  return reservationRepository.findByUserId(userId);
};
```

### 2. DRY (Don't Repeat Yourself)

중복 코드는 함수나 유틸리티로 추출:

**나쁜 예:**

```typescript
// 여러 곳에서 반복
const token = localStorage.getItem('accessToken');
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
};
```

**좋은 예:**

```typescript
// api.ts
function getAuthHeaders() {
  const token = localStorage.getItem('accessToken');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
```

### 3. 함수는 한 가지 일만

**나쁜 예:**

```typescript
function handleReservation(data) {
  // 검증
  if (!data.roomId) throw new Error('roomId required');
  if (!data.startTime) throw new Error('startTime required');

  // 충돌 체크
  const hasConflict = checkConflict(data);
  if (hasConflict) throw new Error('Conflict');

  // 저장
  const reservation = createReservation(data);

  // 이메일 전송
  sendEmail(reservation.userId, 'Reservation created');

  return reservation;
}
```

**좋은 예:**

```typescript
function validateReservationData(data) {
  if (!data.roomId) throw new Error('roomId required');
  if (!data.startTime) throw new Error('startTime required');
}

function handleReservation(data) {
  validateReservationData(data);
  await checkConflict(data);
  const reservation = await createReservation(data);
  await notifyUser(reservation.userId, 'created');
  return reservation;
}
```

## TypeScript 스타일

### 타입 정의

**인터페이스 vs 타입:**

- 인터페이스: 확장 가능한 객체 구조
- 타입: Union, Intersection, Primitive 타입

```typescript
// 객체 구조 - Interface 사용
interface User {
  userId: number;
  username: string;
  email: string;
}

// Union 타입 - Type 사용
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled';

// Props - Interface 사용
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}
```

### 타입 단언 대신 타입 가드

**나쁜 예:**

```typescript
const user = response.data as User;
```

**좋은 예:**

```typescript
function isUser(obj: any): obj is User {
  return 'userId' in obj && 'username' in obj;
}

const data = response.data;
if (isUser(data)) {
  // data는 User 타입
}
```

### Null/Undefined 처리

**옵셔널 체이닝 사용:**

```typescript
// 나쁜 예
const roomName = reservation && reservation.room && reservation.room.name;

// 좋은 예
const roomName = reservation?.room?.name;
```

**Nullish Coalescing:**

```typescript
// 나쁜 예 (0, '', false도 기본값 사용)
const count = data.count || 10;

// 좋은 예 (null, undefined만 기본값 사용)
const count = data.count ?? 10;
```

### Enum vs Union Type

간단한 상수는 Union Type 선호:

```typescript
// 나쁜 예
enum UserRole {
  STUDENT = 'student',
  STAFF = 'staff',
  ADMIN = 'admin',
}

// 좋은 예
type UserRole = 'student' | 'staff' | 'admin';
```

## React 컴포넌트

### 함수형 컴포넌트

**기본 구조:**

```tsx
import { useState, useEffect } from 'react';

interface MyComponentProps {
  title: string;
  onSubmit?: (data: string) => void;
}

export function MyComponent({ title, onSubmit }: MyComponentProps) {
  const [state, setState] = useState<string>('');

  useEffect(() => {
    // Side effect
  }, []);

  const handleClick = () => {
    onSubmit?.(state);
  };

  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Submit</button>
    </div>
  );
}
```

### Hook 순서

1. useState
2. useContext
3. useReducer
4. useEffect
5. 커스텀 hooks
6. 이벤트 핸들러

```tsx
export function MyComponent() {
  // 1. State
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // 2. Context
  const { user } = useAuth();

  // 3. Effects
  useEffect(() => {
    loadData();
  }, []);

  // 4. Event handlers
  const handleSubmit = () => {
    // ...
  };

  // 5. Render
  return <div>...</div>;
}
```

### 조건부 렌더링

**Early Return 패턴:**

```tsx
export function MyComponent({ data }: Props) {
  if (!data) {
    return <div>No data</div>;
  }

  if (data.length === 0) {
    return <div>Empty</div>;
  }

  return (
    <div>
      {data.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}
```

### Props 전달

**스프레드 연산자 활용:**

```tsx
// 나쁜 예
<Button
  label={button.label}
  onClick={button.onClick}
  disabled={button.disabled}
  className={button.className}
/>

// 좋은 예
<Button {...buttonProps} />
```

## NestJS 백엔드

### Controller

```typescript
@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  create(
    @Body() createDto: CreateReservationDto,
    @Req() req: any,
  ) {
    return this.reservationService.create(createDto, req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.findOne(id);
  }
}
```

**원칙:**
- 비즈니스 로직은 Service로 분리
- DTO를 통한 검증
- Guard를 통한 인증/인가
- Decorator 적극 활용

### Service

```typescript
@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  async create(createDto: CreateReservationDto, userId: number) {
    // 1. Validation
    this.validateReservationTime(createDto.startTime, createDto.endTime);

    // 2. Business logic
    await this.checkConflict(createDto.roomId, createDto.startTime, createDto.endTime);

    // 3. Database operation
    const reservation = this.reservationRepository.create({
      ...createDto,
      userId,
    });

    return this.reservationRepository.save(reservation);
  }

  private validateReservationTime(start: Date, end: Date) {
    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
  }
}
```

### DTO (Data Transfer Object)

```typescript
import { IsInt, IsString, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReservationDto {
  @IsInt()
  @Min(1)
  roomId: number;

  @IsString()
  @MinLength(1)
  title: string;

  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @Type(() => Date)
  @IsDate()
  endTime: Date;
}
```

### Entity

```typescript
@Entity('reservation')
export class Reservation {
  @PrimaryGeneratedColumn({ name: 'reservation_id' })
  reservationId: number;

  @Column({ name: 'reservation_title' })
  title: string;

  @Column({ name: 'reservation_starttime', type: 'timestamp' })
  startTime: Date;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'room_id' })
  room: Room;
}
```

## 네이밍 컨벤션

### 파일명

**React 컴포넌트:**
- PascalCase: `MyComponent.tsx`
- 페이지: `AdminDashboard.tsx`
- 컴포넌트: `ReservationCard.tsx`

**TypeScript 파일:**
- camelCase: `api.ts`, `utils.ts`
- 타입 정의: `calendar.ts`, `auth.ts`

**NestJS:**
- kebab-case: `reservation.service.ts`, `jwt-auth.guard.ts`
- Entity: `user.entity.ts`
- DTO: `create-reservation.dto.ts`

### 변수명

```typescript
// Boolean - is/has 접두사
const isLoading = true;
const hasError = false;
const canEdit = user.role === 'admin';

// Array - 복수형
const users = [];
const reservations = [];

// Function - 동사로 시작
function getUser() {}
function createReservation() {}
function handleSubmit() {}

// Constant - UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 20971520;
const API_BASE_URL = 'http://localhost:6112';
```

### 함수명

**명확한 동사 사용:**

- `get`: 데이터 조회
- `fetch`: API 요청
- `create`: 새 항목 생성
- `update`: 기존 항목 수정
- `delete`: 항목 삭제
- `handle`: 이벤트 처리
- `validate`: 검증
- `check`: 조건 확인

```typescript
getUserById(id: number)
fetchReservations()
createReservation(data)
updateRoom(id, data)
deleteUser(id)
handleSubmit()
validateEmail(email)
checkConflict(roomId, start, end)
```

## 코멘트 작성

### JSDoc 주석

**함수 문서화:**

```typescript
/**
 * 예약 충돌을 확인합니다
 *
 * @param roomId - 회의실 ID
 * @param startTime - 시작 시간
 * @param endTime - 종료 시간
 * @returns 충돌 여부
 */
async checkConflict(
  roomId: number,
  startTime: Date,
  endTime: Date,
): Promise<boolean> {
  // Implementation
}
```

### 주석 사용 시기

**좋은 주석:**

```typescript
// 시작 시간 15분 후까지는 지각으로 처리
const LATE_THRESHOLD_MINUTES = 15;

// FIXME: 노쇼 3회 이상 시 자동 예약 금지 로직 추가 필요
if (user.noShowCount >= 3) {
  // TODO
}

// NOTE: TypeORM 버그로 인해 수동 쿼리 사용
const result = await this.repository.query('SELECT ...');
```

**불필요한 주석:**

```typescript
// 나쁜 예 - 코드가 이미 명확함
// user id를 1 증가시킴
userId = userId + 1;

// 좋은 예 - 주석 없이 명확한 코드
userId++;
```

## 에러 처리

### Try-Catch

```typescript
async function loadReservations() {
  try {
    setLoading(true);
    const data = await api.get<Reservation[]>('/reservations/my');
    setReservations(data);
  } catch (error) {
    console.error('Failed to load reservations:', error);
    toast.error('예약 목록을 불러오는데 실패했습니다');
  } finally {
    setLoading(false);
  }
}
```

### 백엔드 에러

```typescript
// 나쁜 예
throw new Error('User not found');

// 좋은 예 - HTTP 예외 사용
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
throw new ForbiddenException('Access denied');
```

### 커스텀 에러

```typescript
export class ReservationConflictException extends ConflictException {
  constructor(roomId: number, startTime: Date) {
    super(`Room ${roomId} is already booked at ${startTime}`);
  }
}

// 사용
throw new ReservationConflictException(roomId, startTime);
```

## Git 커밋 메시지

### 형식

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `style`: 코드 포맷팅
- `docs`: 문서 수정
- `test`: 테스트 코드
- `chore`: 빌드, 설정 등

### 예시

```
feat(reservation): 예약 충돌 실시간 검증 API 추가

- POST /reservations/check-conflict 엔드포인트 구현
- 프론트엔드에서 실시간으로 충돌 여부 확인 가능
- Rate limit 60회/60초 적용

Closes #123
```

```
fix(auth): JWT 토큰 만료 시 자동 로그아웃 처리

토큰이 만료되었을 때 401 응답을 받으면
자동으로 로그아웃하고 로그인 페이지로 이동
```

```
refactor: 중복 API 호출 로직 api.ts로 통합

- 중앙화된 API 서비스 레이어 생성
- 모든 fetch 호출을 api.get/post/patch로 변경
- 인증 토큰 자동 주입
```

### 커밋 크기

- 작은 단위로 자주 커밋
- 한 커밋 = 하나의 논리적 변경
- 커밋 메시지만 보고도 변경 내용 파악 가능

**나쁜 예:**

```
fix: 여러 버그 수정
```

**좋은 예:**

```
fix(reservation): 예약 취소 시 상태 업데이트 오류 수정
fix(auth): 로그아웃 후 토큰 미삭제 버그 수정
fix(ui): 모바일에서 테이블 레이아웃 깨짐 수정
```

## 코드 리뷰 체크리스트

### 기능
- [ ] 요구사항을 만족하는가?
- [ ] 엣지 케이스를 처리하는가?
- [ ] 에러 처리가 적절한가?

### 코드 품질
- [ ] 중복 코드가 없는가?
- [ ] 함수가 하나의 역할만 하는가?
- [ ] 네이밍이 명확한가?
- [ ] 주석이 필요한 부분에만 있는가?

### 보안
- [ ] 입력 검증이 적절한가?
- [ ] SQL Injection 방지가 되는가?
- [ ] XSS 방지가 되는가?
- [ ] 민감한 정보가 노출되지 않는가?

### 성능
- [ ] 불필요한 렌더링이 없는가?
- [ ] N+1 쿼리가 없는가?
- [ ] 적절한 인덱스가 있는가?

### 테스트
- [ ] 주요 로직에 테스트가 있는가?
- [ ] 엣지 케이스 테스트가 있는가?

## 다음 단계

- [시스템 아키텍처](./architecture.md) - 전체 시스템 구조
- [API 가이드](./api-guide.md) - API 엔드포인트
- [프론트엔드 구조](./frontend.md) - React 구조
