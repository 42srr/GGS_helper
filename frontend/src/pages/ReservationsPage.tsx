import { useState, useMemo, useEffect } from 'react';
import { Calendar } from '../components/calendar/Calendar';
import { ReservationFilters } from '../components/reservations/ReservationFilters';
import { ReservationDetailModal } from '../components/reservations/ReservationDetailModal';
import { Header } from '../components/layout/Header';


interface Reservation {
  reservationId: number;
  roomId: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  createdAt?: Date;
  room?: {
    roomId: number;
    name: string;
    location: string;
  };
  user?: {
    userId: number;
    name: string;
  };
}

interface Room {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment?: string;
  description?: string;
  isAvailable: boolean;
}

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsResponse, roomsResponse] = await Promise.all([
        fetch('http://localhost:3001/reservations', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }),
        fetch('http://localhost:3001/rooms', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }),
      ]);

      if (reservationsResponse.ok && roomsResponse.ok) {
        const reservationsData = await reservationsResponse.json();
        const roomsData = await roomsResponse.json();

        // 예약 데이터 처리 - Calendar 컴포넌트는 Date 타입 필요
        const processedReservations: Reservation[] = reservationsData.map((res: any) => ({
          ...res,
          startTime: new Date(res.startTime),
          endTime: new Date(res.endTime),
          createdAt: res.createdAt ? new Date(res.createdAt) : undefined
        }));

        setReservations(processedReservations);
        setRooms(roomsData);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 필터링된 예약 목록
  const filteredReservations = useMemo(() => {
    let filtered = reservations;

    // 회의실 필터 적용
    if (selectedRooms.length > 0) {
      filtered = filtered.filter(reservation =>
        selectedRooms.includes(reservation.roomId.toString())
      );
    }

    return filtered;
  }, [reservations, selectedRooms]);

  const handleEventClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedReservation(null);
  };

  const handleClearFilters = () => {
    setSelectedRooms([]);
  };

  const selectedRoom = selectedReservation
    ? rooms.find(room => room.roomId === selectedReservation.roomId) || null
    : null;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            회의실 예약 현황
          </h1>
          <p className="text-gray-600">
            캘린더에서 예약 현황을 확인하고 관리하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 필터 사이드바 */}
          <div className="lg:col-span-1 space-y-6">
            <ReservationFilters
              rooms={rooms}
              selectedRooms={selectedRooms}
              onRoomFilter={setSelectedRooms}
              onClearFilters={handleClearFilters}
            />

            {/* 통계 정보 */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {filteredReservations.length}
              </div>
              <div className="text-sm text-gray-600">전체 예약</div>
            </div>
          </div>

          {/* 캘린더 메인 영역 */}
          <div className="lg:col-span-3">
            <Calendar
              reservations={filteredReservations}
              onEventClick={handleEventClick}
            />
          </div>
        </div>

        {/* 예약 상세 모달 */}
        <ReservationDetailModal
          reservation={selectedReservation}
          room={selectedRoom}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      </main>
    </div>
  );
}