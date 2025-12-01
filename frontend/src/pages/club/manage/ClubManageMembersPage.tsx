import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  ArrowLeft,
  Search,
  User,
  Shield,
  MoreVertical,
  UserMinus,
  UserCog,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

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
  members: ClubMember[];
}

export function ClubManageMembersPage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

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

  const handleChangeRole = async (memberId: number, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:3001/clubs/${id}/members/${memberId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        alert('멤버 역할이 변경되었습니다.');
        fetchClub();
      } else {
        alert('역할 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to change role:', error);
      alert('역할 변경 중 오류가 발생했습니다.');
    }
  };

  const handleChangeStatus = async (memberId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3001/clubs/${id}/members/${memberId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('멤버 상태가 변경되었습니다.');
        fetchClub();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to change status:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('정말 이 멤버를 동아리에서 제거하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/clubs/${id}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('멤버가 제거되었습니다.');
        fetchClub();
      } else {
        alert('멤버 제거에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('멤버 제거 중 오류가 발생했습니다.');
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
              <p className="text-gray-600">멤버 정보를 불러오는 중...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!club) {
    return null;
  }

  const filteredMembers = club.members.filter(member => {
    const matchesSearch = searchTerm === '' ||
      member.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.user.intraId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">멤버 관리</h1>
            <p className="text-gray-600">{club.name}</p>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="이름 또는 IntraID 검색..."
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
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="active">활동중</SelectItem>
                  <SelectItem value="freeze">휴면</SelectItem>
                  <SelectItem value="work">작업중</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="역할 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 역할</SelectItem>
                  <SelectItem value="leader">동아리장</SelectItem>
                  <SelectItem value="staff">운영진</SelectItem>
                  <SelectItem value="member">멤버</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center text-sm text-gray-600">
                <Users className="w-4 h-4 mr-2" />
                <span>{filteredMembers.length}명의 멤버</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 멤버 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>멤버 목록</CardTitle>
            <CardDescription>동아리 멤버의 역할과 상태를 관리할 수 있습니다.</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                조건에 맞는 멤버가 없습니다.
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
                      <TableHead className="text-right">관리</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMembers.map((member) => (
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'leader')}>
                                <Shield className="w-4 h-4 mr-2" />
                                동아리장으로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'staff')}>
                                <UserCog className="w-4 h-4 mr-2" />
                                운영진으로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeRole(member.id, 'member')}>
                                <User className="w-4 h-4 mr-2" />
                                일반 멤버로 변경
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleChangeStatus(member.id, 'active')}>
                                활동중으로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(member.id, 'freeze')}>
                                휴면으로 변경
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangeStatus(member.id, 'inactive')}>
                                비활성으로 변경
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600"
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                멤버 제거
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
