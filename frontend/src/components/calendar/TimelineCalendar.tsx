import { useMemo } from 'react';
import type { Room, Reservation, TimelineConfig, TimeSlot } from '@/types/calendar';
import { TimelineTimeScale } from './TimelineTimeScale';
import { TimelineRoomRow } from './TimelineRoomRow';
import { TimelineCurrentTimeIndicator } from './TimelineCurrentTimeIndicator';
import { TimelineWeekView } from './TimelineWeekView';
import { TimelineMonthView } from './TimelineMonthView';
import { getRoomColor } from '@/utils/calendar/roomColors';
import { Card, CardContent } from '@/components/ui/card';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface TimelineCalendarProps {
  rooms: Room[];
  reservations: Reservation[];
  selectedDate: Date;
  config?: Partial<TimelineConfig>;
  onReservationClick?: (reservation: Reservation) => void;
  onEmptySlotClick?: (room: Room, timeSlot: TimeSlot) => void;
}

const DEFAULT_CONFIG: TimelineConfig = {
  viewMode: 'day',
  startHour: 9,
  endHour: 21,
  slotDuration: 30,
  showWeekends: true,
};

export function TimelineCalendar({
  rooms,
  reservations,
  selectedDate,
  config,
  onReservationClick,
  onEmptySlotClick,
}: TimelineCalendarProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // viewMode에 따라 예약 필터링
  const filteredReservations = useMemo(() => {
    const viewMode = finalConfig.viewMode;

    if (viewMode === 'day') {
      // 일간: 선택된 날짜만
      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return (
          reservationDate.getFullYear() === selectedDate.getFullYear() &&
          reservationDate.getMonth() === selectedDate.getMonth() &&
          reservationDate.getDate() === selectedDate.getDate()
        );
      });
    } else if (viewMode === 'week') {
      // 주간: 선택된 날짜가 포함된 주의 모든 예약
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return reservationDate >= weekStart && reservationDate <= weekEnd;
      });
    } else {
      // 월간: 선택된 날짜가 포함된 월의 모든 예약
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);

      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return reservationDate >= monthStart && reservationDate <= monthEnd;
      });
    }
  }, [reservations, selectedDate, finalConfig.viewMode]);

  // 회의실별로 예약 그룹화
  const roomReservationsMap = useMemo(() => {
    const map = new Map<number, Reservation[]>();

    rooms.forEach(room => {
      map.set(room.roomId, []);
    });

    filteredReservations.forEach(reservation => {
      const existing = map.get(reservation.roomId) || [];
      map.set(reservation.roomId, [...existing, reservation]);
    });

    return map;
  }, [rooms, filteredReservations]);

  // 오늘 날짜인지 확인
  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  }, [selectedDate]);

  // 주간 뷰
  if (finalConfig.viewMode === 'week') {
    return (
      <TimelineWeekView
        selectedDate={selectedDate}
        rooms={rooms}
        reservations={reservations}
        startHour={finalConfig.startHour}
        endHour={finalConfig.endHour}
        onReservationClick={onReservationClick}
      />
    );
  }

  // 월간 뷰
  if (finalConfig.viewMode === 'month') {
    return (
      <TimelineMonthView
        selectedDate={selectedDate}
        rooms={rooms}
        reservations={reservations}
        onReservationClick={onReservationClick}
      />
    );
  }

  // 일간 뷰 (기존 구현)
  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="relative overflow-x-auto">
          {/* 시간 축 */}
          <TimelineTimeScale
            startHour={finalConfig.startHour}
            endHour={finalConfig.endHour}
            slotDuration={finalConfig.slotDuration}
            date={selectedDate}
          />

          {/* 회의실 행들 */}
          <div className="relative">
            {rooms.map(room => {
              const roomReservations = roomReservationsMap.get(room.roomId) || [];
              const roomColor = getRoomColor(room.roomId);

              return (
                <TimelineRoomRow
                  key={room.roomId}
                  room={room}
                  reservations={roomReservations}
                  roomColor={roomColor}
                  startHour={finalConfig.startHour}
                  endHour={finalConfig.endHour}
                  slotDuration={finalConfig.slotDuration}
                  onReservationClick={onReservationClick}
                  onEmptySlotClick={onEmptySlotClick}
                />
              );
            })}

            {/* 현재 시간 표시선 (오늘인 경우만) */}
            {isToday && (
              <div className="absolute top-0 left-32 right-0 bottom-0 pointer-events-none">
                <TimelineCurrentTimeIndicator
                  startHour={finalConfig.startHour}
                  endHour={finalConfig.endHour}
                />
              </div>
            )}
          </div>
        </div>

        {/* 빈 상태 (회의실이 없을 때) */}
        {rooms.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>표시할 회의실이 없습니다.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
