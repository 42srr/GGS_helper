import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Users, Settings, ArrowLeft } from 'lucide-react';

export function CreateRoomPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    description: '',
    equipment: '',
    isActive: true,
    isConfirm: true
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const roomData = {
        name: formData.name,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        description: formData.description || undefined,
        equipment: formData.equipment || undefined,
        isActive: formData.isActive,
        isConfirm: formData.isConfirm
      };

      const response = await fetch('http://localhost:3001/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(roomData),
      });

      if (response.ok) {
        alert('회의실이 성공적으로 생성되었습니다!');
        navigate('/rooms');
      } else {
        const error = await response.json();
        alert(`회의실 생성 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('Room creation error:', error);
      alert('회의실 생성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              새 회의실 추가
            </h1>
            <p className="text-gray-600">
              새로운 회의실 정보를 입력하여 등록하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">회의실명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="예: 대회의실 A"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">위치 *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="예: 1층 101호"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="capacity">수용 인원 *</Label>
                    <Input
                      id="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', e.target.value)}
                      placeholder="예: 10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="회의실에 대한 간단한 설명을 입력하세요"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="equipment">보유 장비</Label>
                  <Input
                    id="equipment"
                    value={formData.equipment}
                    onChange={(e) => handleInputChange('equipment', e.target.value)}
                    placeholder="예: 프로젝터, 화이트보드, 스피커"
                  />
                </div>

                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                      회의실 활성화
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      비활성화하면 예약할 수 없습니다
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="isConfirm"
                    checked={formData.isConfirm}
                    onChange={(e) => handleInputChange('isConfirm', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <Label htmlFor="isConfirm" className="text-sm font-medium cursor-pointer">
                      관리자 승인 필요
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      체크하면 예약 시 관리자 승인이 필요합니다 (pending 상태)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 미리보기 */}
            {(formData.name || formData.location || formData.capacity) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    미리보기
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold">
                        {formData.name || '회의실명'}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs ${
                        formData.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {formData.isActive ? '사용 가능' : '사용 불가'}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {formData.location || '위치 정보'}
                    </p>
                    <div className="flex items-center text-sm mb-2">
                      <Users className="w-4 h-4 mr-2 text-gray-400" />
                      <span>최대 {formData.capacity || '0'}명</span>
                    </div>
                    {formData.description && (
                      <p className="text-sm text-gray-600 mb-2">{formData.description}</p>
                    )}
                    {formData.equipment && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-700">보유 장비: </span>
                        <span className="text-gray-600">{formData.equipment}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 제출 버튼 */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!formData.name || !formData.location || !formData.capacity || submitting}
              >
                {submitting ? '생성 중...' : '회의실 생성'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}