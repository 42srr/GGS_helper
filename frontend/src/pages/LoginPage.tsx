import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export function LoginPage() {
  const { login, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname;

  useEffect(() => {
    if (isAuthenticated) {
      // 이미 원하는 페이지가 있으면 그곳으로
      if (from) {
        navigate(from, { replace: true });
      } else {
        // 관리자면 /admin, 일반 사용자면 /dashboard
        navigate(isAdmin() ? '/admin' : '/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, from, isAdmin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">42</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            42 경산 캠퍼스에 오신 걸 환영합니다
          </h2>
          <p className="mt-4 text-gray-600">
            42 계정으로 로그인하여 회의실 예약과 동아리 관리 서비스를 이용하세요.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button
            onClick={login}
            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-base font-medium"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 10.5V12h3l1-3h-4V7h4l-1-3h-3c-3.87 0-7 3.13-7 7v2H2l1 3h2v5.5c5.16-.76 9-4.95 9-10.5V2z"/>
            </svg>
            42 계정으로 로그인
          </Button>

          <div className="text-center text-sm text-gray-600">
            <p>
              로그인하면{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                서비스 약관
              </a>{' '}
              및{' '}
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                개인정보 처리방침
              </a>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-xs text-gray-500 text-center">
              이 서비스는 42 경산 캠퍼스 학생들을 위한 것입니다.
              <br />
              42 계정이 필요합니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}