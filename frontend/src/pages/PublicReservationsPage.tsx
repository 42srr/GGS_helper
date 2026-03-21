import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/calendar/Calendar';
import { PublicReservationDetailModal } from '@/components/reservations/PublicReservationDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import type { Reservation } from '@/types/calendar';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="룸잇" className="w-8 h-8 rounded-lg" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">룸잇</h1>
                <p className="text-xs sm:text-sm text-secondary">회의실 예약 시스템</p>
              </div>
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
            <h2 className="text-2xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">회의실 예약 현황</h2>
            <p className="text-sm sm:text-base text-secondary">실시간 회의실 예약 상황을 확인하세요</p>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-accent mx-auto"></div>
                <p className="mt-3 sm:mt-4 text-sm sm:text-base text-secondary">예약 정보를 불러오는 중...</p>
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
