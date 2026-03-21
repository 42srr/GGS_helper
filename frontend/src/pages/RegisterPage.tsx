import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';

export function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    intraId: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    // 비밀번호 복잡도 검증 (대문자, 소문자, 숫자 포함)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('비밀번호는 대문자, 소문자, 숫자를 모두 포함해야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          intraId: formData.intraId,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message;
        if (Array.isArray(errorMessage)) {
          setError(errorMessage.join(', '));
        } else if (typeof errorMessage === 'string') {
          setError(errorMessage);
        } else {
          setError('회원가입에 실패했습니다.');
        }
        return;
      }

      setSuccess(true);
      toast.success('회원가입이 완료되었습니다');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError('회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg">
          회원가입이 완료되었습니다. 로그인 페이지로 이동합니다...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img src="/logo.png" alt="룸잇" className="mx-auto w-16 h-16 rounded-xl mb-6" />
          <h2 className="text-3xl font-bold text-primary">회원가입</h2>
          <p className="mt-4 text-secondary">
            새 계정을 만들어 회의실 예약 서비스를 이용하세요.
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
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="intraId">인트라 ID</Label>
              <Input
                id="intraId"
                name="intraId"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={formData.intraId}
                onChange={handleChange}
                placeholder="인트라 ID를 입력하세요"
                disabled={isLoading}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                placeholder="비밀번호를 입력하세요 (최소 8자)"
                disabled={isLoading}
                className="mt-1"
              />
              <p className="text-xs text-secondary mt-1">
                대문자, 소문자, 숫자를 포함해야 합니다
              </p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="비밀번호를 다시 입력하세요"
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
              {isLoading ? '처리 중...' : '회원가입'}
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors"
            >
              이미 계정이 있으신가요? 로그인
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
