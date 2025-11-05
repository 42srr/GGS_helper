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
  User,
  Search,
  Download,
  ArrowLeft,
  Mail,
  Shield,
  Calendar,
  Activity,
  Filter,
  Users,
  UserCheck,
  UserX,
  Crown,
  GraduationCap,
  Settings,
  AlertTriangle,
} from 'lucide-react';

interface UserData {
  userId: number;
  intraId: string;
  name: string;
  profileImgUrl?: string;
  grade?: string;
  role: string;
  isAvailable: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  noShowCount?: number;
  isReservationBanned?: boolean;
  banUntil?: string;
  _count?: {
    reservations: number;
  };
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, statusFilter, sortBy]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = [...users];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.intraId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) =>
        statusFilter === 'active' ? user.isAvailable : !user.isAvailable
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'login':
          return a.intraId.localeCompare(b.intraId);
        case 'name':
          return (a.name || a.intraId).localeCompare(b.name || b.intraId);
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        alert('사용자 상태가 변경되었습니다.');
        fetchUsers();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Toggle user status error:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const changeUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:3001/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        alert('사용자 권한이 변경되었습니다.');
        fetchUsers();
      } else {
        alert('권한 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Change user role error:', error);
      alert('권한 변경 중 오류가 발생했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('http://localhost:3001/users/export', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `users_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export users:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <UserCheck className="w-3 h-3 mr-1" />
        활성
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 border-red-200">
        <UserX className="w-3 h-3 mr-1" />
        비활성
      </Badge>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { color: 'bg-red-100 text-red-800 border-red-200', icon: Crown, label: '관리자' },
      staff: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Settings, label: '직원' },
      club_leader: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Shield, label: '동아리장' },
      student: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: GraduationCap, label: '학생' },
    };

    const config = roleConfig[role] || roleConfig.student;
    const IconComponent = config.icon;

    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* 헤더 섹션 */}
        <div className="mb-8">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              관리자 대시보드로 돌아가기
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">사용자 관리</h1>
              <p className="text-gray-600 mt-1">OAuth로 로그인한 사용자들을 관리합니다</p>
            </div>
            <Button onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel 내보내기
            </Button>
          </div>
        </div>

        {/* 필터 섹션 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              필터 및 검색
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="로그인ID, 이름, 이메일 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="상태 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">최근 가입순</SelectItem>
                  <SelectItem value="oldest">오래된 가입순</SelectItem>
                  <SelectItem value="login">로그인ID순</SelectItem>
                  <SelectItem value="name">이름순</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSortBy('recent');
                }}
              >
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 사용자</p>
                  <p className="text-2xl font-bold mt-1">{users.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">활성 사용자</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {users.filter((u) => u.isActive).length}
                  </p>
                </div>
                <UserCheck className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">비활성 사용자</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {users.filter((u) => !u.isActive).length}
                  </p>
                </div>
                <UserX className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 사용자 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>사용자 목록</CardTitle>
            <CardDescription>총 {filteredUsers.length}명의 사용자</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">사용자 정보</th>
                    <th className="text-left p-4 font-medium">권한</th>
                    <th className="text-left p-4 font-medium">상태</th>
                    <th className="text-left p-4 font-medium">노쇼</th>
                    <th className="text-left p-4 font-medium">가입일</th>
                    <th className="text-left p-4 font-medium">최종 로그인</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.userId} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {user.profileImgUrl ? (
                            <img
                              src={user.profileImgUrl}
                              alt={user.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user.name || user.intraId}</p>
                            <p className="text-sm text-gray-500">{user.intraId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Select
                          value={user.role}
                          onValueChange={(newRole) => changeUserRole(user.userId, newRole)}
                        >
                          <SelectTrigger className="w-36 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">학생</SelectItem>
                            <SelectItem value="club_leader">동아리장</SelectItem>
                            <SelectItem value="staff">직원</SelectItem>
                            <SelectItem value="admin">관리자</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <Select
                          value={user.isAvailable ? "active" : "inactive"}
                          onValueChange={(newStatus) => toggleUserStatus(user.userId, newStatus === "inactive")}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">활성</SelectItem>
                            <SelectItem value="inactive">비활성</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${(user.noShowCount || 0) >= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                              {user.noShowCount || 0}회
                            </span>
                            {(user.noShowCount || 0) >= 3 && (
                              <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                경고
                              </Badge>
                            )}
                          </div>
                          {user.isReservationBanned && user.banUntil && (
                            <span className="text-xs text-red-600">
                              {new Date(user.banUntil) > new Date()
                                ? `금지 (${formatDate(user.banUntil)}까지)`
                                : '금지 해제됨'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </td>
                      <td className="p-4">
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">조건에 맞는 사용자가 없습니다.</p>
                <p className="text-gray-400 text-sm mt-2">다른 필터를 사용해보세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}