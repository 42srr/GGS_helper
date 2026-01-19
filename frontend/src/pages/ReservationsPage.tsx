import { useState, useMemo, useEffect } from 'react';
import { TimelineCalendar } from '../components/calendar/TimelineCalendar';
import { TimelineHeader } from '../components/calendar/TimelineHeader';
import { ReservationFilters } from '../components/reservations/ReservationFilters';
import { ReservationDetailModal } from '../components/reservations/ReservationDetailModal';
import { Header } from '../components/layout/Header';
import type { ViewMode, TimeSlot, Reservation, Room } from '@/types/calendar';

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 타임라인 뷰 상태
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reservationsResponse, roomsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/reservations`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/rooms`, {
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

  const handleEmptySlotClick = (room: Room, timeSlot: TimeSlot) => {
    // 빈 슬롯 클릭 시 예약 생성 페이지로 이동

    // TODO: 빠른 예약 모달 또는 예약 생성 페이지로 이동
  };

  const selectedRoom = selectedReservation
    ? rooms.find(room => room.roomId === selectedReservation.roomId) || null
    : null;

  // 필터링된 회의실 목록
  const filteredRooms = useMemo(() => {
    if (selectedRooms.length === 0) return rooms;
    return rooms.filter(room => selectedRooms.includes(room.roomId.toString()));
  }, [rooms, selectedRooms]);

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
          <div className="lg:col-span-3 space-y-6">
            {/* 타임라인 헤더 */}
            <TimelineHeader
              viewMode={viewMode}
              selectedDate={selectedDate}
              onViewModeChange={setViewMode}
              onDateChange={setSelectedDate}
            />

            {/* 타임라인 캘린더 */}
            <TimelineCalendar
              rooms={filteredRooms}
              reservations={filteredReservations}
              selectedDate={selectedDate}
              config={{ viewMode }}
              onReservationClick={handleEventClick}
              onEmptySlotClick={handleEmptySlotClick}
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