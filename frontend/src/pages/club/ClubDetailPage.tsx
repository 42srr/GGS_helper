import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users,
  User,
  ArrowLeft,
  Clock,
  Calendar,
  Mail,
  UserPlus,
  Shield,
  Activity,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface ClubMember {
  id: number;
  clubId: number;
  userId: number;
  role: 'member' | 'leader' | 'staff';
  status: 'freeze' | 'active' | 'work' | 'inactive';
  createdAt: string;
  user: {
    userId: number;
    name: string;
    intraId: string;
    profileImgUrl?: string;
  };
}

interface Club {
  id: number;
  name: string;
  description?: string;
  leaderId: number;
  countMember: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  leader: {
    userId: number;
    name: string;
    intraId: string;
    profileImgUrl?: string;
  };
  members: ClubMember[];
}

export function ClubDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchClubDetail();
    }
  }, [id]);

  const fetchClubDetail = async () => {
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
      } else {
        alert('동아리 정보를 불러오는데 실패했습니다.');
        navigate('/clubs');
      }
    } catch (error) {
      console.error('Failed to fetch club detail:', error);
      alert('동아리 정보를 불러오는데 실패했습니다.');
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'leader':
        return <Badge className="bg-red-100 text-red-700 border-red-200">동아리장</Badge>;
      case 'staff':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">운영진</Badge>;
      case 'member':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">멤버</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">활동중</Badge>;
      case 'freeze':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">휴면</Badge>;
      case 'work':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">작업중</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">비활성</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
          <Link to="/clubs">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              동아리 목록으로
            </Button>
          </Link>
        </div>

        {/* 동아리 기본 정보 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">{club.name}</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    활동중
                  </Badge>
                </div>
                <CardDescription className="text-base mt-2">
                  {club.description || '동아리 설명이 없습니다.'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 동아리장 정보 */}
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                {club.leader.profileImgUrl && (
                  <img
                    src={club.leader.profileImgUrl}
                    alt={club.leader.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-gray-600">동아리장</p>
                  </div>
                  <p className="font-semibold text-gray-900">{club.leader.name}</p>
                  <p className="text-sm text-gray-600">@{club.leader.intraId}</p>
                </div>
              </div>

              {/* 멤버 수 */}
              <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">전체 멤버</p>
                  <p className="text-2xl font-bold text-purple-900">{club.countMember}명</p>
                </div>
              </div>

              {/* 생성일 */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Calendar className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">생성일</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(club.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* 가입 버튼 / 관리 버튼 */}
            <div className="mt-6 pt-6 border-t flex gap-3">
              {user && (club.leaderId === user.userId || club.members?.some(m => m.userId === user.userId && (m.role === 'leader' || m.role === 'staff'))) ? (
                <Link to={`/clubs/${id}/manage`}>
                  <Button variant="outline" size="lg">
                    <Settings className="w-4 h-4 mr-2" />
                    동아리 관리
                  </Button>
                </Link>
              ) : null}
              <Button className="w-full md:w-auto" size="lg">
                <UserPlus className="w-4 h-4 mr-2" />
                동아리 가입하기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 멤버 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  동아리 멤버
                </CardTitle>
                <CardDescription className="mt-1">
                  총 {club.members?.length || 0}명의 멤버
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!club.members || club.members.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                멤버 정보가 없습니다.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>프로필</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>IntraID</TableHead>
                      <TableHead>역할</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>가입일</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {club.members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.user.profileImgUrl ? (
                            <img
                              src={member.user.profileImgUrl}
                              alt={member.user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{member.user.name}</TableCell>
                        <TableCell className="text-gray-600">@{member.user.intraId}</TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>{getStatusBadge(member.status)}</TableCell>
                        <TableCell className="text-gray-600">
                          {new Date(member.createdAt).toLocaleDateString('ko-KR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
