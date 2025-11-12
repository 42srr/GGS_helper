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
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  Download,
  ArrowLeft,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Reservation {
  reservationId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'finished' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  isNoShow?: boolean;
  noShowReportedAt?: string;
  noShowReportCount?: number;
  room: {
    roomId: number;
    name: string;
    location: string;
  };
  user: {
    userId: number;
    login?: string;
    name?: string;
    email?: string;
  };
}

export function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [noShowFilter, setNoShowFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    filterAndSortReservations();
  }, [reservations, searchTerm, statusFilter, noShowFilter, dateFilter, sortBy]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/reservations', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      }
    } catch (error) {
      console.error('Failed to fetch reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortReservations = () => {
    let filtered = [...reservations];

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(
        (res) =>
          res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.user.login?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          res.user.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((res) => res.status === statusFilter);
    }

    // 노쇼 필터
    if (noShowFilter === 'noshow') {
      filtered = filtered.filter((res) => res.isNoShow);
    } else if (noShowFilter === 'normal') {
      filtered = filtered.filter((res) => !res.isNoShow);
    }

    // 날짜 필터
    if (dateFilter) {
      filtered = filtered.filter((res) => {
        const resDate = new Date(res.startTime).toISOString().split('T')[0];
        return resDate === dateFilter;
      });
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'date-asc':
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case 'room':
          return a.room.name.localeCompare(b.room.name);
        case 'user':
          return (a.user.login || a.user.name || '').localeCompare(b.user.login || b.user.name || '');
        default:
          return 0;
      }
    });

    setFilteredReservations(filtered);
  };

  const handleDelete = async (reservationId: number) => {
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`http://localhost:3001/reservations/${reservationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('예약이 삭제되었습니다.');
        fetchReservations();
      } else {
        alert('예약 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete reservation error:', error);
      alert('예약 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleStatusChange = async (reservationId: number, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:3001/reservations/admin/${reservationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        alert('예약 상태가 변경되었습니다.');
        fetchReservations();
      } else {
        const errorData = await response.json();
        alert(`상태 변경에 실패했습니다: ${errorData.message || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('Update reservation status error:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const exportToExcel = async () => {
    try {
      const response = await fetch('http://localhost:3001/reservations/export', {
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
        a.download = `reservations_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export reservations:', error);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            승인 대기
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            확정
          </Badge>
        );
      case 'finished':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            완료
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            취소
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            알 수 없음
          </Badge>
        );
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
              <p className="text-gray-600">예약 정보를 불러오는 중...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">예약 관리</h1>
              <p className="text-gray-600 mt-1">전체 예약을 조회하고 관리합니다</p>
            </div>
            <Button onClick={exportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel 내보내기
            </Button>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">전체 예약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reservations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">승인 대기</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {reservations.filter(r => r.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">확정 예약</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reservations.filter(r => r.status === 'confirmed').length}
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                노쇼 신고
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {reservations.filter(r => r.isNoShow).length}
              </div>
              <p className="text-xs text-red-600 mt-1">
                총 {reservations.reduce((sum, r) => sum + (r.noShowReportCount || 0), 0)}회 신고됨
              </p>
            </CardContent>
          </Card>
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
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="제목, 회의실, 예약자 검색..."
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
                  <SelectItem value="pending">승인 대기</SelectItem>
                  <SelectItem value="confirmed">확정</SelectItem>
                  <SelectItem value="finished">완료</SelectItem>
                  <SelectItem value="cancelled">취소</SelectItem>
                </SelectContent>
              </Select>
              <Select value={noShowFilter} onValueChange={setNoShowFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="노쇼 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="noshow">노쇼만</SelectItem>
                  <SelectItem value="normal">정상만</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="날짜 선택"
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="정렬 기준" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">최신순</SelectItem>
                  <SelectItem value="date-asc">오래된순</SelectItem>
                  <SelectItem value="room">회의실명순</SelectItem>
                  <SelectItem value="user">예약자순</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setNoShowFilter('all');
                  setDateFilter('');
                  setSortBy('date-desc');
                }}
              >
                초기화
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 상세 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 예약</p>
                  <p className="text-2xl font-bold mt-1">{reservations.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">승인 대기</p>
                  <p className="text-2xl font-bold mt-1 text-yellow-600">
                    {reservations.filter((r) => r.status === 'pending').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">확정됨</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">
                    {reservations.filter((r) => r.status === 'confirmed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">완료됨</p>
                  <p className="text-2xl font-bold mt-1 text-blue-600">
                    {reservations.filter((r) => r.status === 'finished').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">취소됨</p>
                  <p className="text-2xl font-bold mt-1 text-red-600">
                    {reservations.filter((r) => r.status === 'cancelled').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 예약 테이블 */}
        <Card>
          <CardHeader>
            <CardTitle>예약 목록</CardTitle>
            <CardDescription>총 {filteredReservations.length}개의 예약</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-4 font-medium">ID</th>
                    <th className="text-left p-4 font-medium">예약 제목</th>
                    <th className="text-left p-4 font-medium">회의실</th>
                    <th className="text-left p-4 font-medium">예약자</th>
                    <th className="text-left p-4 font-medium">예약 일시</th>
                    <th className="text-left p-4 font-medium">시간</th>
                    <th className="text-left p-4 font-medium">상태</th>
                    <th className="text-left p-4 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservations.map((reservation) => (
                    <tr key={reservation.reservationId} className="border-b hover:bg-gray-50">
                      <td className="p-4 text-sm">{reservation.reservationId}</td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{reservation.title}</p>
                          {reservation.description && (
                            <p className="text-xs text-gray-500 mt-1">{reservation.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          <div>
                            <p className="font-medium">{reservation.room.name}</p>
                            <p className="text-xs text-gray-500">{reservation.room.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {reservation.user.name || reservation.user.login}
                            </p>
                            <p className="text-xs text-gray-500">{reservation.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm">{formatDateTime(reservation.startTime)}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="text-sm">
                            {new Date(reservation.startTime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {' - '}
                            {new Date(reservation.endTime).toLocaleTimeString('ko-KR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {getStatusBadge(reservation.status)}
                          {reservation.isNoShow && (
                            <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              노쇼 {reservation.noShowReportCount && `(${reservation.noShowReportCount}회)`}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex space-x-2">
                          <Select
                            value={reservation.status}
                            onValueChange={(value) => handleStatusChange(reservation.reservationId, value)}
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">승인 대기</SelectItem>
                              <SelectItem value="confirmed">확정</SelectItem>
                              <SelectItem value="finished">완료</SelectItem>
                              <SelectItem value="cancelled">취소</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(reservation.reservationId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredReservations.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">조건에 맞는 예약이 없습니다.</p>
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