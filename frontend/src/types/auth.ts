export interface User {
  id: number;
  email: string;
  login: string;
  firstName: string;
  lastName: string;
  displayName: string;
  imageUrl?: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<void>;
}