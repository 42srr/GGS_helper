import { useMemo, useEffect, useState } from 'react';
import type { Room, Reservation, TimelineConfig, TimeSlot } from '@/types/calendar';
import { TimelineWeekView } from './TimelineWeekView';
import { TimelineMonthView } from './TimelineMonthView';
import { getRoomColor } from '@/utils/calendar/roomColors';
import { getStatusStyle } from '@/utils/calendar/roomColors';
import { formatTimeRange, formatTime, getCurrentTimePosition } from '@/utils/calendar/timeSlots';
import { Card, CardContent } from '@/components/ui/card';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Users, MapPin } from 'lucide-react';

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
      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return (
          reservationDate.getFullYear() === selectedDate.getFullYear() &&
          reservationDate.getMonth() === selectedDate.getMonth() &&
          reservationDate.getDate() === selectedDate.getDate()
        );
      });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return reservationDate >= weekStart && reservationDate <= weekEnd;
      });
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      return reservations.filter(reservation => {
        const reservationDate = new Date(reservation.startTime);
        return reservationDate >= monthStart && reservationDate <= monthEnd;
      });
    }
  }, [reservations, selectedDate, finalConfig.viewMode]);

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

  // 일간 뷰 (가로=시간, 세로=회의실, 시간축 가로 스크롤)
  return (
    <DayView
      rooms={rooms}
      reservations={filteredReservations}
      selectedDate={selectedDate}
      startHour={finalConfig.startHour}
      endHour={finalConfig.endHour}
      slotDuration={finalConfig.slotDuration}
      onReservationClick={onReservationClick}
      onEmptySlotClick={onEmptySlotClick}
    />
  );
}

// ── 일간 뷰 (가로=시간, 세로=회의실, 시간축 최소폭 보장) ──

interface DayViewProps {
  rooms: Room[];
  reservations: Reservation[];
  selectedDate: Date;
  startHour: number;
  endHour: number;
  slotDuration: number;
  onReservationClick?: (reservation: Reservation) => void;
  onEmptySlotClick?: (room: Room, timeSlot: TimeSlot) => void;
}

function DayView({
  rooms,
  reservations,
  selectedDate,
  startHour,
  endHour,
  slotDuration,
  onReservationClick,
  onEmptySlotClick,
}: DayViewProps) {
  const totalHours = endHour - startHour;
  // 시간당 최소 폭(px) - 레이블이 겹치지 않도록 보장
  const HOUR_WIDTH = 80;
  const timelineWidth = totalHours * HOUR_WIDTH;

  const isToday = useMemo(() => {
    const today = new Date();
    return (
      selectedDate.getFullYear() === today.getFullYear() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getDate() === today.getDate()
    );
  }, [selectedDate]);

  // 회의실별 예약 그룹화
  const roomReservationsMap = useMemo(() => {
    const map = new Map<number, Reservation[]>();
    rooms.forEach(room => map.set(room.roomId, []));
    reservations.forEach(reservation => {
      const existing = map.get(reservation.roomId) || [];
      map.set(reservation.roomId, [...existing, reservation]);
    });
    return map;
  }, [rooms, reservations]);

  // 시간 레이블
  const timeLabels = useMemo(() => {
    const labels: { hour: number; label: string }[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      const time = new Date(selectedDate);
      time.setHours(hour, 0, 0, 0);
      labels.push({ hour, label: formatTime(time) });
    }
    return labels;
  }, [startHour, endHour, selectedDate]);

  if (rooms.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="py-12 text-center text-muted-foreground">
            <p>표시할 회의실이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="flex" style={{ minWidth: `${timelineWidth + 80}px` }}>
            {/* 회의실 이름 열 (고정) */}
            <div className="w-16 sm:w-32 flex-shrink-0 border-r border-border bg-background sticky left-0 z-20">
              {/* 빈 헤더 (시간 레이블 행과 높이 맞춤) */}
              <div className="h-10 sm:h-12 border-b border-border" />

              {/* 회의실 이름들 */}
              {rooms.map(room => {
                const roomColor = getRoomColor(room.roomId);
                return (
                  <div
                    key={room.roomId}
                    className="border-b border-border p-1.5 sm:p-3 bg-background"
                    style={{ height: '80px' }}
                  >
                    <div className="flex items-start gap-1 sm:gap-2">
                      <div
                        className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-0.5 flex-shrink-0"
                        style={{ backgroundColor: roomColor.base }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[10px] sm:text-sm truncate">
                          {room.name}
                        </div>
                        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Users className="w-3 h-3" />
                          <span>{room.capacity}인</span>
                        </div>
                        {room.location && (
                          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{room.location}</span>
                          </div>
                        )}
                        <div className="sm:hidden text-[9px] text-muted-foreground mt-0.5">
                          {room.capacity}인
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 타임라인 영역 (스크롤 가능) */}
            <div className="flex-1">
              {/* 시간 레이블 헤더 */}
              <div className="relative h-10 sm:h-12 border-b border-border bg-background sticky top-0 z-10">
                {timeLabels.map(item => {
                  const position = ((item.hour - startHour) / totalHours) * 100;
                  return (
                    <div
                      key={item.hour}
                      className="absolute top-0 h-full flex items-center"
                      style={{ left: `${position}%` }}
                    >
                      <div className="absolute top-0 w-px h-full bg-border" />
                      <span className="ml-1.5 sm:ml-2 text-[10px] sm:text-xs font-medium text-muted-foreground select-none whitespace-nowrap">
                        {item.label}
                      </span>
                    </div>
                  );
                })}

                {/* 30분 보조선 */}
                {slotDuration === 30 &&
                  Array.from({ length: totalHours }).map((_, index) => {
                    const position = ((index + 0.5) / totalHours) * 100;
                    return (
                      <div
                        key={`half-${index}`}
                        className="absolute top-0 w-px h-full bg-border opacity-30"
                        style={{ left: `${position}%` }}
                      />
                    );
                  })}
              </div>

              {/* 회의실 행들 */}
              <div className="relative">
                {rooms.map(room => {
                  const roomColor = getRoomColor(room.roomId);
                  const roomReservations = roomReservationsMap.get(room.roomId) || [];

                  return (
                    <DayViewRow
                      key={room.roomId}
                      room={room}
                      reservations={roomReservations}
                      roomColor={roomColor}
                      startHour={startHour}
                      endHour={endHour}
                      totalHours={totalHours}
                      slotDuration={slotDuration}
                      onReservationClick={onReservationClick}
                      onEmptySlotClick={onEmptySlotClick}
                    />
                  );
                })}

                {/* 현재 시간 표시선 */}
                {isToday && (
                  <CurrentTimeVerticalLine startHour={startHour} endHour={endHour} />
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── 회의실 행 (가로 타임라인) ──

interface DayViewRowProps {
  room: Room;
  reservations: Reservation[];
  roomColor: { base: string; border: string; bg: string; text: string };
  startHour: number;
  endHour: number;
  totalHours: number;
  slotDuration: number;
  onReservationClick?: (reservation: Reservation) => void;
  onEmptySlotClick?: (room: Room, timeSlot: TimeSlot) => void;
}

function DayViewRow({
  room,
  reservations,
  roomColor,
  startHour,
  totalHours,
  slotDuration,
  onReservationClick,
  onEmptySlotClick,
}: DayViewRowProps) {
  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget || !onEmptySlotClick) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;

    const totalMinutes = totalHours * 60;
    const clickedMinutes = (percentage / 100) * totalMinutes;
    const clickedHour = Math.floor(clickedMinutes / 60) + startHour;
    const clickedMinute = Math.floor((clickedMinutes % 60) / slotDuration) * slotDuration;

    const startTime = new Date();
    startTime.setHours(clickedHour, clickedMinute, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + slotDuration);

    onEmptySlotClick(room, { startTime, endTime, duration: slotDuration });
  };

  return (
    <div
      className="relative border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
      style={{ height: '80px' }}
      onClick={handleRowClick}
    >
      {/* 시간 구분선 (1시간) */}
      {Array.from({ length: totalHours }).map((_, index) => {
        const position = ((index + 1) / totalHours) * 100;
        return (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-px bg-border pointer-events-none"
            style={{ left: `${position}%` }}
          />
        );
      })}

      {/* 30분 구분선 */}
      {slotDuration === 30 &&
        Array.from({ length: totalHours }).map((_, index) => {
          const position = ((index + 0.5) / totalHours) * 100;
          return (
            <div
              key={`half-${index}`}
              className="absolute top-0 bottom-0 w-px bg-border opacity-20 pointer-events-none"
              style={{ left: `${position}%` }}
            />
          );
        })}

      {/* 예약 블록들 */}
      {reservations.map(reservation => {
        const totalMinutes = totalHours * 60;
        const resStartMinutes = (reservation.startTime.getHours() - startHour) * 60 + reservation.startTime.getMinutes();
        const resDuration = (reservation.endTime.getHours() - reservation.startTime.getHours()) * 60
          + reservation.endTime.getMinutes() - reservation.startTime.getMinutes();

        const leftPercent = (resStartMinutes / totalMinutes) * 100;
        const widthPercent = (resDuration / totalMinutes) * 100;

        const statusStyle = getStatusStyle(reservation.status);

        return (
          <div
            key={reservation.reservationId}
            className={cn(
              'absolute top-1 bottom-1 rounded-md px-1.5 sm:px-2 py-1 cursor-pointer overflow-hidden',
              'border-l-4 transition-all duration-200',
              'hover:shadow-lg hover:z-10',
              roomColor.bg,
              roomColor.text,
              statusStyle.className,
            )}
            style={{
              left: `${leftPercent}%`,
              width: `${widthPercent}%`,
              borderLeftColor: roomColor.border,
              minWidth: '24px',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onReservationClick?.(reservation);
            }}
          >
            {statusStyle.icon && (
              <span className="absolute top-0.5 right-0.5 text-[10px]">{statusStyle.icon}</span>
            )}
            <div className="text-[10px] sm:text-xs font-semibold truncate pr-3">
              {reservation.title}
            </div>
            <div className="text-[10px] sm:text-xs opacity-75 truncate">
              {formatTimeRange(reservation.startTime, reservation.endTime)}
            </div>
            {reservation.user && (
              <div className="hidden sm:block text-[10px] opacity-60 truncate mt-0.5">
                {reservation.user.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 현재 시간 세로선 ──

function CurrentTimeVerticalLine({
  startHour,
  endHour,
}: {
  startHour: number;
  endHour: number;
}) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const position = getCurrentTimePosition(currentTime, startHour, endHour);

  if (position <= 0 || position >= 100) return null;

  return (
    <div
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={{ left: `${position}%` }}
    >
      <div className="absolute top-0 w-0.5 h-full bg-red-500" />
      <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-md" />
    </div>
  );
}
