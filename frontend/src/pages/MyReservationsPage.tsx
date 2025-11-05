import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Plus, Trash2, Eye, LogOut, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ReservationDetailModal } from '../components/reservations/ReservationDetailModal';

interface Reservation {
  reservationId: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status?: string;
  isNoShow?: boolean;
  checkInAt?: string;
  room: {
    roomId: number;
    name: string;
    location: string;
  };
  user: {
    userId: number;
    login: string;
  };
}

export function MyReservationsPage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyReservations();
    }
  }, [user]);

  const fetchMyReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/reservations/my', {
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


  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return date.toDateString() === today.toDateString();
  };

  const isPast = (endTimeStr: string) => {
    const now = new Date();
    const endDateTime = new Date(endTimeStr);
    return endDateTime < now;
  };

  const canEarlyReturn = (reservation: Reservation) => {
    // 노쇼 상태거나 취소된 예약은 조기 반납 불가
    if (reservation.isNoShow || reservation.status === 'cancelled') {
      return false;
    }

    // 체크인을 하지 않았으면 조기 반납 불가
    if (!reservation.checkInAt) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const endTime = new Date(reservation.endTime);
    // 예약 시작 시간이 지났고, 종료 시간 전이면 조기 반납 가능
    return startTime <= now && now < endTime && reservation.status !== 'finished';
  };

  const canCheckIn = (reservation: Reservation) => {
    // 이미 체크인했으면 불가
    if (reservation.checkInAt) return false;
    // 확정된 예약만 체크인 가능
    if (reservation.status !== 'confirmed') return false;
    // 노쇼 상태면 체크인 불가
    if (reservation.isNoShow) return false;

    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const tenMinutesBeforeStart = new Date(startTime.getTime() - 10 * 60 * 1000);
    const tenMinutesAfterStart = new Date(startTime.getTime() + 10 * 60 * 1000);

    // 시작 10분 전부터 시작 후 10분까지만 체크인 가능
    return now >= tenMinutesBeforeStart && now <= tenMinutesAfterStart;
  };

  const canCancel = (reservation: Reservation) => {
    // 이미 종료되었거나 취소된 예약은 취소 불가
    if (reservation.status === 'finished' || reservation.status === 'cancelled') {
      return false;
    }

    // 노쇼 상태면 취소 불가
    if (reservation.isNoShow) {
      return false;
    }

    const now = new Date();
    const startTime = new Date(reservation.startTime);
    const thirtyMinutesBeforeStart = new Date(startTime.getTime() - 30 * 60 * 1000);

    // 예약 시작 30분 전까지만 취소 가능
    return now < thirtyMinutesBeforeStart;
  };

  const handleCheckIn = async (reservationId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/reservations/${reservationId}/check-in`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (response.ok) {
        alert('체크인이 완료되었습니다.');
        fetchMyReservations(); // 목록 새로고침
      } else {
        const errorData = await response.json();
        alert(errorData.message || '체크인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert('체크인 중 오류가 발생했습니다.');
    }
  };

  const handleEarlyReturn = async (reservationId: number) => {
    if (confirm('회의실을 조기 반납하시겠습니까? 예약이 즉시 종료됩니다.')) {
      try {
        const response = await fetch(`http://localhost:3001/reservations/${reservationId}/early-return`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          alert('조기 반납이 완료되었습니다.');
          fetchMyReservations(); // 목록 새로고침
        } else {
          const errorData = await response.json();
          alert(errorData.message || '조기 반납에 실패했습니다.');
        }
      } catch (error) {
        console.error('Early return error:', error);
        alert('조기 반납 중 오류가 발생했습니다.');
      }
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (confirm('정말로 이 예약을 취소하시겠습니까?')) {
      try {
        const response = await fetch(`http://localhost:3001/reservations/${reservationId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (response.ok) {
          alert('예약이 취소되었습니다.');
          fetchMyReservations(); // 목록 새로고침
        } else {
          alert('예약 취소에 실패했습니다.');
        }
      } catch (error) {
        console.error('Cancel reservation error:', error);
        alert('예약 취소 중 오류가 발생했습니다.');
      }
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
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                내 예약
              </h1>
              <p className="text-gray-600">
                나의 회의실 예약 내역을 확인하고 관리하세요.
              </p>
            </div>
            <Link to="/create-reservation">
              <Button className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                새 예약
              </Button>
            </Link>
          </div>

          {/* 통계 */}
          <div className="mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {reservations.length}
                </div>
                <div className="text-sm text-gray-600">전체 예약</div>
              </CardContent>
            </Card>
          </div>

          {/* 예약 목록 */}
          {reservations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  예약이 없습니다
                </h3>
                <p className="text-gray-600 mb-4">
                  아직 생성된 예약이 없습니다.
                </p>
                <Link to="/create-reservation">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    첫 예약 만들기
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회의실</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시간</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reservations.map((reservation: Reservation) => {
                        const reservationPast = isPast(reservation.endTime);
                        const reservationToday = isToday(reservation.startTime);

                        return (
                          <tr key={reservation.reservationId} className={reservationPast ? 'opacity-60' : 'hover:bg-gray-50'}>
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{reservation.title}</span>
                                {reservationToday && (
                                  <Badge variant="outline" className="border-blue-200 text-blue-600 text-xs">
                                    오늘
                                  </Badge>
                                )}
                              </div>
                              {reservation.description && (
                                <p className="text-sm text-gray-500 mt-1">{reservation.description}</p>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{reservation.room.name}</div>
                                  <div className="text-xs text-gray-500">{reservation.room.location}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatDate(reservation.startTime)}
                            </td>
                            <td className="px-4 py-4 text-sm text-gray-900">
                              {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                            </td>
                            <td className="px-4 py-4">
                              {reservation.status === 'pending' && (
                                <Badge variant="outline" className="border-yellow-200 text-yellow-600">대기중</Badge>
                              )}
                              {reservation.status === 'confirmed' && (
                                <Badge variant="outline" className="border-green-200 text-green-600">확정</Badge>
                              )}
                              {reservation.status === 'finished' && (
                                <Badge variant="outline" className="border-gray-200 text-gray-600">종료</Badge>
                              )}
                              {reservation.status === 'cancelled' && (
                                <Badge variant="outline" className="border-red-200 text-red-600">취소</Badge>
                              )}
                              {reservation.isNoShow && (
                                <Badge variant="outline" className="border-red-200 text-red-600 ml-1">노쇼</Badge>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedReservation(reservation)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>

                                {/* 체크인 버튼 또는 완료 뱃지 */}
                                {reservation.checkInAt ? (
                                  <Badge variant="outline" className="border-green-200 text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    체크인 완료
                                  </Badge>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleCheckIn(reservation.reservationId)}
                                    disabled={!canCheckIn(reservation)}
                                    className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    체크인
                                  </Button>
                                )}

                                {/* 조기 반납 버튼 */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEarlyReturn(reservation.reservationId)}
                                  disabled={!canEarlyReturn(reservation)}
                                  className="text-blue-600 hover:text-blue-700 border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                                >
                                  <LogOut className="w-4 h-4" />
                                </Button>

                                {/* 예약 취소 버튼 */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelReservation(reservation.reservationId)}
                                  disabled={!canCancel(reservation)}
                                  className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:text-gray-400"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 예약 상세 모달 */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          isOpen={!!selectedReservation}
          onClose={() => {
            setSelectedReservation(null);
            fetchMyReservations();
          }}
        />
      )}
    </div>
  );
}