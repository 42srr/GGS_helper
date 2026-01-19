# 인증/인가 시스템

GGS Helper의 인증 및 권한 관리 시스템을 설명합니다.

## 목차

- [개요](#개요)
- [인증 흐름](#인증-흐름)
- [JWT 토큰](#jwt-토큰)
- [권한 관리](#권한-관리)
- [보안 기능](#보안-기능)
- [API 엔드포인트](#api-엔드포인트)

## 개요

GGS Helper는 JWT(JSON Web Token) 기반 인증을 사용합니다.

### 주요 기능

- JWT Bearer Token 인증
- Role-based Access Control (RBAC)
- Token Blacklist (로그아웃)
- 비밀번호 해싱 (bcrypt)
- Rate Limiting

## 인증 흐름

### 회원가입 플로우

```
User Input (RegisterPage)
    │
    ▼
POST /auth/register
    │
    ▼
RegisterDto Validation
  - username: 영문, 숫자, -, _ 만
  - email: 유효한 이메일
  - password: 8자 이상, 대소문자+숫자
    │
    ▼
Check Duplicate (username, email)
    │
    ▼
bcrypt.hash(password, 10)
    │
    ▼
Save to Database
    │
    ▼
Return User (without password)
```

### 로그인 플로우

```
User Input (LoginPage)
    │
    ▼
POST /auth/login
    │
    ▼
Find User by username
    │
    ▼
bcrypt.compare(input, hashed)
    │
    ├─ Match ─────────────┐
    │                     ▼
    │              Generate JWT
    │                     │
    │              payload: {
    │                userId,
    │                username,
    │                role
    │              }
    │                     │
    │              JWT.sign(payload, secret)
    │                     │
    │                     ▼
    │              Return { accessToken, user }
    │                     │
    │                     ▼
    │              Store in localStorage
    │                     │
    │                     ▼
    │              Navigate to Dashboard
    │
    └─ No Match ──> 401 Unauthorized
```

### 인증된 요청 플로우

```
API Request
    │ Headers: Authorization: Bearer <token>
    ▼
JwtAuthGuard
    │
    ▼
Extract Token
    │
    ▼
Check Blacklist
    │
    ├─ Blacklisted ──> 401 Unauthorized
    │
    ▼
JWT.verify(token, secret)
    │
    ├─ Valid ────────────┐
    │                    ▼
    │             Decode Payload
    │                    │
    │             req.user = payload
    │                    │
    │                    ▼
    │             Pass to Controller
    │
    └─ Invalid ──> 401 Unauthorized
```

### 로그아웃 플로우

```
POST /auth/logout
    │ Authorization: Bearer <token>
    ▼
JwtAuthGuard (인증 확인)
    │
    ▼
Extract Token
    │
    ▼
Add to Blacklist
  - In-memory Set (개발)
  - Redis (프로덕션 권장)
    │
    ▼
Remove from localStorage (Frontend)
    │
    ▼
Navigate to Login
```

## JWT 토큰

### Payload 구조

```json
{
  "userId": 1,
  "username": "user123",
  "role": "student",
  "iat": 1705756800,
  "exp": 1705843200
}
```

### 토큰 생성

**백엔드 (NestJS):**

```typescript
// auth.service.ts
async login(loginDto: LoginDto) {
  const user = await this.validateUser(loginDto.username, loginDto.password);

  const payload = {
    userId: user.userId,
    username: user.username,
    role: user.role,
  };

  const accessToken = this.jwtService.sign(payload);

  return {
    accessToken,
    user: {
      userId: user.userId,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
```

### 토큰 검증

**JwtStrategy:**

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  }
}
```

### 토큰 저장 (Frontend)

```typescript
// AuthContext.tsx
const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  // localStorage에 저장
  localStorage.setItem('accessToken', data.accessToken);
  setUser(data.user);
};
```

### 토큰 사용

```typescript
// api.ts
const response = await fetch(`${API_BASE_URL}/reservations`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  },
});
```

## 권한 관리

### 사용자 역할 (Role)

| 역할 | 설명 | 권한 |
|-----|------|------|
| `student` | 일반 사용자 | 예약 생성/조회/취소, 체크인/아웃 |
| `staff` | 스태프 | student 권한 |
| `admin` | 관리자 | 모든 권한 (관리 기능 포함) |

### RBAC 구현

**백엔드 Guard:**

```typescript
// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());

    if (!requiredRoles) {
      return true; // 역할 제한 없음
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

**Decorator 사용:**

```typescript
// admin.controller.ts
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
export class AdminController {
  @Get('users')
  getAllUsers() {
    // 관리자만 접근 가능
  }
}
```

### 프론트엔드 권한 체크

**Route Protection:**

```tsx
// AdminRoute.tsx
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || user.role !== 'admin') {
    return <Navigate to="/reservations" />;
  }

  return <>{children}</>;
}
```

**조건부 렌더링:**

```tsx
// Navigation.tsx
export function Navigation() {
  const { user } = useAuth();

  return (
    <nav>
      <Link to="/reservations">예약 현황</Link>
      <Link to="/my-reservations">내 예약</Link>

      {user?.role === 'admin' && (
        <Link to="/admin">관리자</Link>
      )}
    </nav>
  );
}
```

## 보안 기능

### 비밀번호 해싱

**bcrypt 사용:**

```typescript
// auth.service.ts
async register(registerDto: RegisterDto) {
  const hashedPassword = await bcrypt.hash(registerDto.password, 10);

  const user = this.userRepository.create({
    ...registerDto,
    password: hashedPassword,
  });

  return this.userRepository.save(user);
}
```

**검증:**

```typescript
async validateUser(username: string, password: string) {
  const user = await this.userRepository.findOne({
    where: { username },
    select: ['userId', 'username', 'password', 'role', 'email', 'name'],
  });

  if (!user) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new UnauthorizedException('Invalid credentials');
  }

  const { password: _, ...result } = user;
  return result;
}
```

### Token Blacklist

로그아웃 시 토큰을 블랙리스트에 추가하여 재사용 방지:

**개발 환경 (In-memory):**

```typescript
// auth.service.ts
private blacklistedTokens = new Set<string>();

async logout(userId: number, token: string) {
  this.blacklistedTokens.add(token);
}

isTokenBlacklisted(token: string): boolean {
  return this.blacklistedTokens.has(token);
}
```

**프로덕션 환경 (Redis 권장):**

```typescript
// auth.service.ts (Redis 사용 시)
async logout(userId: number, token: string) {
  const decoded = this.jwtService.decode(token) as any;
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  await this.redisService.set(
    `blacklist:${token}`,
    'true',
    'EX',
    ttl,
  );
}

async isTokenBlacklisted(token: string): Promise<boolean> {
  const exists = await this.redisService.exists(`blacklist:${token}`);
  return exists === 1;
}
```

### Rate Limiting

**엔드포인트별 제한:**

```typescript
// auth.controller.ts
@Post('register')
@Throttle({ default: { limit: 3, ttl: 3600000 } })  // 1시간에 3번
async register(@Body() registerDto: RegisterDto) {
  return this.authService.register(registerDto);
}

@Post('login')
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 60초에 5번
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

### 입력 검증

**DTO Validation:**

```typescript
// register.dto.ts
export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username must contain only letters, numbers, hyphens, and underscores',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;
}
```

## API 엔드포인트

### POST /auth/register

회원가입

**Request:**

```json
{
  "username": "user123",
  "email": "user@example.com",
  "password": "Pass1234!",
  "name": "홍길동",
  "phone": "010-1234-5678"
}
```

**Response (201):**

```json
{
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "name": "홍길동",
  "role": "student"
}
```

### POST /auth/login

로그인

**Request:**

```json
{
  "username": "user123",
  "password": "Pass1234!"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "username": "user123",
    "email": "user@example.com",
    "name": "홍길동",
    "role": "student",
    "isReservationBanned": false
  }
}
```

### POST /auth/logout

로그아웃

**Request:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me

현재 사용자 정보 조회

**Request:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "userId": 1,
  "username": "user123",
  "email": "user@example.com",
  "name": "홍길동",
  "role": "student"
}
```

## 보안 체크리스트

### 구현된 보안 기능

- [x] JWT 토큰 기반 인증
- [x] bcrypt 비밀번호 해싱 (salt rounds: 10)
- [x] Token Blacklist (로그아웃)
- [x] Rate Limiting (Brute force 방지)
- [x] 입력 검증 (DTO validators)
- [x] Role-based Access Control
- [x] CORS 설정

### 추가 권장 사항 (프로덕션)

- [ ] Refresh Token 구현
- [ ] 2FA (Two-Factor Authentication)
- [ ] Redis를 사용한 Token Blacklist
- [ ] 비밀번호 복잡도 정책 강화
- [ ] 계정 잠금 (로그인 실패 N회)
- [ ] Session timeout
- [ ] HTTPS 강제

## 다음 단계

- [예약 시스템](./reservations.md) - 예약 기능
- [관리자 기능](./admin.md) - 관리자 권한
- [보안 기능](./security.md) - 보안 정책
- [API 가이드](../development/api-guide.md) - API 상세
