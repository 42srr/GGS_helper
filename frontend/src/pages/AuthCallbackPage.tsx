import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshToken } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshTokenParam = searchParams.get('refresh_token');
      const userParam = searchParams.get('user');

      if (accessToken && refreshTokenParam && userParam) {
        try {
          // URL에서 사용자 정보 파싱
          const user = JSON.parse(decodeURIComponent(userParam));

          // 토큰들을 로컬 스토리지에 저장
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshTokenParam);
          localStorage.setItem('userId', user.userId.toString());

          // AuthContext 상태 업데이트를 위해 토큰 갱신 함수 호출
          await refreshToken();

          // 로그인 전 페이지 또는 대시보드로 리다이렉트
          const redirectPath = localStorage.getItem('redirectAfterLogin') || '/dashboard';
          localStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath, { replace: true });
        } catch (error) {
          console.error('Failed to process auth callback:', error);
          navigate('/login', { replace: true });
        }
      } else {
        console.error('Missing authentication parameters');
        navigate('/login', { replace: true });
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, refreshToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">로그인 중...</p>
      </div>
    </div>
  );
}