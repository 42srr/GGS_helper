import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
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
    profileImgUrl?: string;
  };
}

export function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [filteredClubs, setFilteredClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchClubs();
  }, []);

  useEffect(() => {
    filterAndSortClubs();
  }, [clubs, searchTerm, statusFilter, sortBy]);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/clubs/admin/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClubs(data);
      }
    } catch (error) {
      console.error('Failed to fetch clubs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortClubs = () => {
    let filtered = [...clubs];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (club) =>
          club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          club.leader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          club.leader.intraId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((club) => club.status === statusFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'members':
          return b.countMember - a.countMember;
        default:
          return 0;
      }
    });

    setFilteredClubs(filtered);
  };

  const handleApprove = async (clubId: number) => {
    if (!confirm('이 동아리를 승인하시겠습니까?')) return;

    try {
      const response = await fetch(`http://localhost:3001/clubs/admin/${clubId}/approve`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('동아리가 승인되었습니다.');
        fetchClubs();
      } else {
        alert('동아리 승인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to approve club:', error);
      alert('동아리 승인 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (clubId: number) => {
    if (!confirm('이 동아리를 거부하시겠습니까?')) return;

    try {
      const response = await fetch(`http://localhost:3001/clubs/admin/${clubId}/reject`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('동아리가 거부되었습니다.');
        fetchClubs();
      } else {
        alert('동아리 거부에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to reject club:', error);
      alert('동아리 거부 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            승인 대기
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            승인됨
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            거부됨
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = {
    pending: clubs.filter(c => c.status === 'pending').length,
    approved: clubs.filter(c => c.status === 'approved').length,
    rejected: clubs.filter(c => c.status === 'rejected').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              관리자 대시보드로 돌아가기
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">동아리 관리</h1>
          <p className="text-gray-600">
            동아리 생성 신청을 검토하고 승인하거나 거부할 수 있습니다.
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">승인 대기</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">승인됨</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">거부됨</p>
                  <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                필터 및 검색
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchClubs}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="동아리명, 동아리장 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="pending">승인 대기</SelectItem>
                  <SelectItem value="approved">승인됨</SelectItem>
                  <SelectItem value="rejected">거부됨</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">최신순</SelectItem>
                  <SelectItem value="oldest">오래된순</SelectItem>
                  <SelectItem value="name">이름순</SelectItem>
                  <SelectItem value="members">멤버수순</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 동아리 목록 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>동아리 목록</CardTitle>
                <CardDescription className="mt-1">
                  총 {filteredClubs.length}개의 동아리
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <p className="mt-2 text-gray-600">로딩 중...</p>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">조건에 맞는 동아리가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">동아리명</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">동아리장</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">멤버수</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">상태</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">신청일</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClubs.map((club) => (
                      <tr key={club.id} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{club.name}</p>
                            {club.description && (
                              <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                {club.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {club.leader.profileImgUrl && (
                              <img
                                src={club.leader.profileImgUrl}
                                alt={club.leader.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {club.leader.name}
                              </p>
                              <p className="text-xs text-gray-500">@{club.leader.intraId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users className="w-4 h-4" />
                            <span className="text-sm">{club.countMember}명</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">{getStatusBadge(club.status)}</td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {new Date(club.createdAt).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="py-4 px-4">
                          {club.status === 'pending' && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-green-200 text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(club.id)}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                승인
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(club.id)}
                              >
                                <XCircle className="w-3 h-3 mr-1" />
                                거부
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
