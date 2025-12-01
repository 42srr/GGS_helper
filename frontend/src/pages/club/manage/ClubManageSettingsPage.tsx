import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
} from 'lucide-react';

interface User {
  userId: number;
  name: string;
  intraId: string;
}

interface Club {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  status: string;
  leader: User;
}

export function ClubManageSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId] = useState<number>(0);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (id) {
      fetchClub();
      fetchUsers();
    }
  }, [id]);

  const fetchClub = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/clubs/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClub(data);
        setName(data.name);
        setDescription(data.description || '');
        setLeaderId(data.leaderId);
      }
    } catch (error) {
      console.error('Failed to fetch club:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
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
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert('동아리 이름을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3001/clubs/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name,
          description,
          leaderId,
        }),
      });

      if (response.ok) {
        alert('동아리 정보가 수정되었습니다.');
        navigate(`/clubs/${id}/manage`);
      } else {
        const error = await response.json();
        alert(`수정 실패: ${error.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Failed to update club:', error);
      alert('동아리 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 동아리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    if (!confirm('모든 멤버와 데이터가 삭제됩니다. 정말 진행하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/clubs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('동아리가 삭제되었습니다.');
        navigate('/clubs');
      } else {
        alert('동아리 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete club:', error);
      alert('동아리 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">동아리 정보를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!club) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link to={`/clubs/${id}/manage`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              관리 대시보드로
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">동아리 설정</h1>
            <p className="text-gray-600">{club.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 기본 정보 수정 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>기본 정보</CardTitle>
                <CardDescription>동아리의 기본 정보를 수정할 수 있습니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">동아리 이름 *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="동아리 이름을 입력하세요"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">동아리 설명</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="동아리에 대한 설명을 입력하세요"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="leader">동아리장 *</Label>
                    <Select
                      value={leaderId.toString()}
                      onValueChange={(value) => setLeaderId(Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="동아리장을 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.userId} value={user.userId.toString()}>
                            {user.name} (@{user.intraId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      현재 동아리장: {club.leader.name} (@{club.leader.intraId})
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={() => navigate(`/clubs/${id}/manage`)}>
                      취소
                    </Button>
                    <Button type="submit" disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? '저장 중...' : '변경사항 저장'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* 위험 영역 */}
          <div className="lg:col-span-1">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">위험 영역</CardTitle>
                <CardDescription>신중하게 진행해주세요.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-red-900 mb-1">동아리 삭제</h4>
                      <p className="text-sm text-red-700 mb-3">
                        동아리를 삭제하면 모든 멤버와 관련 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        동아리 삭제
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">동아리 상태</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    현재 상태: <span className="font-medium">{club.status}</span>
                  </p>
                  <p className="text-xs text-gray-500">
                    상태 변경은 관리자만 가능합니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
