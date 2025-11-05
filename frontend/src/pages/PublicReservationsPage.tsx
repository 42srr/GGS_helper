import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/calendar/Calendar';
import { PublicReservationDetailModal } from '@/components/reservations/PublicReservationDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn, Clock, Users, CheckCircle } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001';

interface Reservation {
  reservationId: number;
  roomId: number;
  roomName?: string;
  userId: number;
  userName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status?: 'confirmed' | 'pending' | 'cancelled';
  createdAt?: Date;
}

export function PublicReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/reservations`);

      if (!response.ok) {
        throw new Error('예약 정보를 불러오는데 실패했습니다.');
      }

      const data = await response.json();
      const formattedReservations = data.map((reservation: any) => ({
        ...reservation,
        startTime: new Date(reservation.startTime),
        endTime: new Date(reservation.endTime),
        createdAt: reservation.createdAt ? new Date(reservation.createdAt) : undefined,
      }));

      setReservations(formattedReservations);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
      console.error('Failed to fetch reservations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">42 ERP</h1>
              <p className="text-xs sm:text-sm text-gray-600">회의실 예약 시스템</p>
            </div>
            <Button onClick={handleLogin} className="gap-1 sm:gap-2 text-sm sm:text-base px-3 sm:px-4 h-8 sm:h-9">
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">로그인</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Calendar Section */}
        <section className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">회의실 예약 현황</h2>
            <p className="text-sm sm:text-base text-gray-600">실시간 회의실 예약 상황을 확인하세요</p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">예약 정보를 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <p className="text-sm sm:text-base text-red-600">{error}</p>
                <Button onClick={fetchReservations} className="mt-3 sm:mt-4">
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Calendar reservations={reservations} onEventClick={handleReservationClick} />
          )}
        </section>

        {/* Guidelines Section */}
        <section className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {/* Meeting Room Guidelines */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                회의실 이용 수칙
              </h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5 sm:mt-1">•</span>
                  <span>예약 시간을 엄수해 주세요. 늦을 경우 예약이 취소될 수 있습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5 sm:mt-1">•</span>
                  <span>회의실 사용 후 정리정돈을 부탁드립니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5 sm:mt-1">•</span>
                  <span>예약 취소는 최소 1시간 전에 해주세요.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5 sm:mt-1">•</span>
                  <span>다른 사용자를 위해 소음에 주의해 주세요.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5 sm:mt-1">•</span>
                  <span>회의실 내 음식물 반입을 자제해 주세요.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold mt-0.5 sm:mt-1">•</span>
                  <span>장비 사용 시 주의해서 다뤄주세요.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Login Information */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <CardContent className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                회의실 예약하기
              </h3>
              <div className="space-y-3 sm:space-y-4">
                <p className="text-sm sm:text-base text-gray-700">
                  42 계정으로 로그인하면 회의실을 예약하고 관리할 수 있습니다.
                </p>

                <div className="bg-white rounded-lg p-3 sm:p-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>실시간 예약 현황 확인</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>간편한 예약 생성 및 관리</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                    <Users className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>내 예약 내역 조회</span>
                  </div>
                </div>

                <Button
                  onClick={handleLogin}
                  className="w-full gap-2 py-5 sm:py-6 text-sm sm:text-base"
                  size="lg"
                >
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  42 계정으로 로그인
                </Button>

                <p className="text-xs text-gray-600 text-center">
                  42 서울 학생 및 스태프만 이용 가능합니다
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <p className="text-center text-gray-600 text-xs sm:text-sm">
            © 2024 42 ERP. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Reservation Detail Modal */}
      <PublicReservationDetailModal
        reservation={selectedReservation}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
