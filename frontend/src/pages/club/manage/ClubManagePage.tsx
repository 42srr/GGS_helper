import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Settings,
  ArrowLeft,
  UserPlus,
  Shield,
  Activity,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface Club {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  countMember: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  leader: {
    userId: number;
    name: string;
    intraId: string;
  };
  members: any[];
}

export function ClubManagePage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClub();
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
      }
    } catch (error) {
      console.error('Failed to fetch club:', error);
    } finally {
      setLoading(false);
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

  const activeMembers = club.members?.filter(m => m.status === 'active').length || 0;
  const pendingMembers = club.members?.filter(m => m.status === 'freeze').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link to={`/clubs/${id}`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              동아리 상세로
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">동아리 관리</h1>
              <p className="text-gray-600">{club.name}</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Shield className="w-3 h-3 mr-1" />
              관리자
            </Badge>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">전체 멤버</p>
                  <p className="text-2xl font-bold text-blue-600">{club.countMember}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">활동 멤버</p>
                  <p className="text-2xl font-bold text-green-600">{activeMembers}</p>
                </div>
                <Activity className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">대기 멤버</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingMembers}</p>
                </div>
                <UserPlus className="w-8 h-8 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">운영 기간</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.floor((new Date().getTime() - new Date(club.createdAt).getTime()) / (1000 * 60 * 60 * 24))}일
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 관리 메뉴 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to={`/clubs/${id}/manage/members`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>멤버 관리</CardTitle>
                      <CardDescription>동아리 멤버 조회 및 권한 관리</CardDescription>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  멤버 상태 변경, 역할 할당, 가입 승인 등을 관리할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link to={`/clubs/${id}/manage/settings`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Settings className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>동아리 설정</CardTitle>
                      <CardDescription>동아리 정보 및 설정 변경</CardDescription>
                    </div>
                  </div>
                  <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  동아리 이름, 설명, 리더 변경 등 기본 정보를 수정할 수 있습니다.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
