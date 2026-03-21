import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [intraId, setIntraId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated) {
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(isAdmin() ? '/admin' : '/reservations', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(intraId, password);
    } catch (err: any) {
      setError(err.response?.data?.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="max-w-md w-full space-y-8 px-4">
        <div className="text-center">
          <img src="/logo.png" alt="룸잇" className="mx-auto w-16 h-16 rounded-xl mb-6" />
          <h2 className="text-3xl font-bold text-primary">
            룸잇
          </h2>
          <p className="mt-4 text-secondary">
            계정으로 로그인하여 회의실 예약 서비스를 이용하세요.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="intraId">인트라 ID</Label>
              <Input
                id="intraId"
                type="text"
                required
                value={intraId}
                onChange={(e) => setIntraId(e.target.value)}
                placeholder="인트라 ID를 입력하세요"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                disabled={isLoading}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/register"
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              계정이 없으신가요? 회원가입
            </Link>
          </div>
        </form>

        <div className="mt-8">
          <div className="border-t border-line pt-6">
            <p className="text-xs text-secondary text-center">
              이 서비스는 42 경산 캠퍼스 학생들을 위한 것입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
