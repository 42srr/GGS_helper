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
  email: string;
  username: string;
  name: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // 로컬 스토리지에서 토큰 확인
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      console.log('[AUTH-CHECK] Starting authentication check');
      console.log('[AUTH-CHECK] Token exists:', !!accessToken);

      if (accessToken) {
        try {
          // 현재 사용자 정보 가져오기
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const user: User = await response.json();
            console.log('[AUTH-CHECK] Logged in as:', user.username, '| Role:', user.role);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } else if (response.status === 401 && refreshToken) {
            console.log('[AUTH-CHECK] Token expired, attempting refresh');
            // 토큰 갱신 시도
            await handleRefreshToken();
          } else {
            console.log('[AUTH-CHECK] Invalid token, clearing storage');
            // 토큰이 유효하지 않음
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setAuthState({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          console.error('[AUTH-CHECK] Failed:', error);
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        console.log('[AUTH-CHECK] No token found, user not authenticated');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    checkAuth();
  }, []);

  const handleRefreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const userId = localStorage.getItem('userId');

    if (!refreshToken || !userId) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: parseInt(userId),
          refreshToken,
        }),
      });

      if (response.ok) {
        const { access_token } = await response.json();
        localStorage.setItem('accessToken', access_token);

        // 사용자 정보 다시 가져오기
        const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (userResponse.ok) {
          const user: User = await userResponse.json();
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      const { access_token, user } = await response.json();

      // 토큰과 사용자 정보 저장
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('userId', user.userId.toString());

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    const accessToken = localStorage.getItem('accessToken');

    console.log('[LOGOUT] Starting logout process');
    console.log('[LOGOUT] Current localStorage keys:', Object.keys(localStorage));

    // 먼저 상태를 초기화
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    // 백엔드에 로그아웃 요청 (비동기로 처리, 실패해도 계속 진행)
    if (accessToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        console.log('[LOGOUT] Backend logout successful');
      } catch (error) {
        console.error('[LOGOUT] Backend logout failed:', error);
      }
    }

    // 인증 관련 항목만 명시적으로 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    sessionStorage.clear();

    console.log('[LOGOUT] Storage cleared');
    console.log('[LOGOUT] Remaining localStorage keys:', Object.keys(localStorage));

    // 페이지 새로고침 대신 navigate 사용하도록 수정 필요
    // 하지만 이 컴포넌트에서는 navigate를 사용할 수 없으므로
    // window.location을 사용하되, 약간의 딜레이를 줘서 storage가 반영되도록 함
    setTimeout(() => {
      console.log('[LOGOUT] Redirecting to login page');
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

    // Admin has all permissions
    if (userRole === Role.ADMIN) return true;

    // Define role permissions based on backend role enum
    const rolePermissions: Record<Role, string[]> = {
      [Role.STUDENT]: [
        'reservation:create',
        'reservation:read',
        'reservation:update',
        'reservation:delete',
        'club:read',
        'club:join',
        'room:read',
        'stats:read',
      ],
      [Role.STAFF]: [
        'reservation:*',
        'club:read',
        'club:create',
        'club:join',
        'room:*',
        'stats:read',
        'user:read',
      ],
      [Role.CLUB_LEADER]: [
        'reservation:*',
        'club:read',
        'club:create',
        'club:update',
        'club:member:*',
        'room:*',
        'stats:read',
        'user:read',
      ],
      [Role.ADMIN]: ['*'], // Admin has all permissions
    };

    const userPermissions = rolePermissions[userRole] || [];

    // Check wildcard permissions
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

// Export types for use in other components
export type { User, AuthState, AuthContextType };