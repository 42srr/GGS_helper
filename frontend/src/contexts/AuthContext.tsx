import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export const Role = {
  STUDENT: 'student',
  STAFF: 'staff',
  CLUB_LEADER: 'club_leader',
  ADMIN: 'admin',
} as const;

export type Role = typeof Role[keyof typeof Role];

interface User {
  userId: number;
  intraId: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (intraId: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isStaff: () => boolean;
  isClubLeader: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 쿠키 기반 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });

        if (response.ok) {
          const user: User = await response.json();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } else if (response.status === 401) {
          // 토큰 갱신 시도
          const refreshed = await handleRefreshToken();
          if (!refreshed) {
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const handleRefreshToken = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // 갱신 성공 → 사용자 정보 다시 가져오기
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          credentials: 'include',
        });

        if (userResponse.ok) {
          const user: User = await userResponse.json();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const login = async (intraId: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ intraId, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { user } = await response.json();

    setAuthState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = async () => {
    // 먼저 상태를 초기화
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // 백엔드에 로그아웃 요청 (쿠키 삭제)
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      // 실패해도 계속 진행
    }

    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  };

  const refreshToken = async () => {
    await handleRefreshToken();
  };

  // Role-checking utilities
  const hasRole = (role: Role): boolean => {
    return authState.user?.role === role;
  };

  const hasAnyRole = (roles: Role[]): boolean => {
    return authState.user ? roles.includes(authState.user.role) : false;
  };

  const hasPermission = (permission: string): boolean => {
    if (!authState.user) return false;

    const userRole = authState.user.role;

    if (userRole === Role.ADMIN) return true;

    const rolePermissions: Record<Role, string[]> = {
      [Role.STUDENT]: [
        'reservation:create', 'reservation:read', 'reservation:update', 'reservation:delete',
        'club:read', 'club:join', 'room:read', 'stats:read',
      ],
      [Role.STAFF]: [
        'reservation:*', 'club:read', 'club:create', 'club:join',
        'room:*', 'stats:read', 'user:read',
      ],
      [Role.CLUB_LEADER]: [
        'reservation:*', 'club:read', 'club:create', 'club:update', 'club:member:*',
        'room:*', 'stats:read', 'user:read',
      ],
      [Role.ADMIN]: ['*'],
    };

    const userPermissions = rolePermissions[userRole] || [];
    const [resource] = permission.split(':');
    if (userPermissions.includes(`${resource}:*`) || userPermissions.includes('*')) {
      return true;
    }
    return userPermissions.includes(permission);
  };

  const isAdmin = (): boolean => hasRole(Role.ADMIN);
  const isStaff = (): boolean => hasAnyRole([Role.STAFF, Role.ADMIN]);
  const isClubLeader = (): boolean => hasAnyRole([Role.CLUB_LEADER, Role.ADMIN]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshToken,
    hasRole,
    hasAnyRole,
    hasPermission,
    isAdmin,
    isStaff,
    isClubLeader,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User, AuthState, AuthContextType };
