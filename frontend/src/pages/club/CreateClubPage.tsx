import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Users, User, Info } from 'lucide-react';

interface User {
  userId: number;
  name: string;
  intraId: string;
  profileImgUrl: string;
}

export function CreateClubPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedLeader, setSelectedLeader] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    leaderId: '',
    description: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch('http://localhost:3001/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLeaderSelect = (userId: string) => {
    const user = users.find(u => u.userId.toString() === userId);
    setSelectedLeader(user || null);
    setFormData(prev => ({ ...prev, leaderId: userId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const clubData = {
        name: formData.name,
        leaderId: parseInt(formData.leaderId),
        description: formData.description || undefined,
      };

      const response = await fetch('http://localhost:3001/clubs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(clubData),
      });

      if (response.ok) {
        alert('동아리가 성공적으로 생성되었습니다!');
        navigate('/clubs');
      } else {
        const error = await response.json();
        alert(`동아리 생성 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
      }
    } catch (error) {
      console.error('Club creation error:', error);
      alert('동아리 생성 중 오류가 발생했습니다.');
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
              새 동아리 생성
            </h1>
            <p className="text-gray-600">
              새로운 동아리 정보를 입력하여 등록하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 기본 정보 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 mr-2" />
                  기본 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">동아리명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="예: 알고리즘 스터디"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">동아리 설명</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="동아리에 대한 간단한 설명을 입력하세요"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    동아리의 목적, 활동 내용 등을 자유롭게 작성해주세요.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 동아리장 선택 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  동아리장 선택
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>동아리장 *</Label>
                  <Select
                    onValueChange={handleLeaderSelect}
                    value={formData.leaderId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="동아리장을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto">
                      {loadingUsers ? (
                        <SelectItem value="loading" disabled>
                          사용자 정보를 불러오는 중...
                        </SelectItem>
                      ) : users.length === 0 ? (
                        <SelectItem value="no-users" disabled>
                          사용 가능한 사용자가 없습니다
                        </SelectItem>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.userId} value={user.userId.toString()}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-sm text-gray-500">({user.intraId})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    동아리장은 자동으로 동아리 멤버로 추가됩니다.
                  </p>
                </div>

                {selectedLeader && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      {selectedLeader.profileImgUrl && (
                        <img
                          src={selectedLeader.profileImgUrl}
                          alt={selectedLeader.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h4 className="font-medium text-gray-900">{selectedLeader.name}</h4>
                        <p className="text-sm text-gray-600">@{selectedLeader.intraId}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 미리보기 */}
            {formData.name && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    미리보기
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formData.name}
                      </h3>
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        활성
                      </span>
                    </div>

                    {formData.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {formData.description}
                      </p>
                    )}

                    {selectedLeader && (
                      <div className="flex items-center gap-2 pt-3 border-t">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          동아리장: <span className="font-medium text-gray-900">{selectedLeader.name}</span>
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        멤버: <span className="font-medium text-gray-900">1명</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 안내 사항 */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center">
                    <Info className="w-4 h-4 mr-2 text-blue-600" />
                    안내 사항
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6 list-disc">
                    <li>동아리명은 중복될 수 없습니다.</li>
                    <li>동아리장은 생성 후에도 변경할 수 있습니다.</li>
                    <li>동아리 생성 후 멤버를 추가할 수 있습니다.</li>
                    <li>동아리 정보는 언제든지 수정 가능합니다.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

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
                disabled={!formData.name || !formData.leaderId || submitting}
              >
                {submitting ? '생성 중...' : '동아리 생성'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
