import type { Room, Reservation, RoomColor, TimeSlot } from '@/types/calendar';
import { TimelineReservationBlock } from './TimelineReservationBlock';
import { calculateReservationPositions } from '@/utils/calendar/reservationLayout';
import { Users, MapPin } from 'lucide-react';
import { useMemo } from 'react';

interface TimelineRoomRowProps {
  room: Room;
  reservations: Reservation[];
  roomColor: RoomColor;
  startHour: number;
  endHour: number;
  slotDuration: number;
  onReservationClick?: (reservation: Reservation) => void;
  onEmptySlotClick?: (room: Room, timeSlot: TimeSlot) => void;
}

export function TimelineRoomRow({
  room,
  reservations,
  roomColor,
  startHour,
  endHour,
  slotDuration,
  onReservationClick,
  onEmptySlotClick,
}: TimelineRoomRowProps) {
  // 예약 배치 위치 계산
  const positions = useMemo(
    () => calculateReservationPositions(reservations, startHour, endHour, slotDuration),
    [reservations, startHour, endHour, slotDuration]
  );

  // 행 높이 동적 계산 (겹치는 예약 고려)
  const rowHeight = useMemo(() => {
    if (positions.length === 0) return 80;
    const maxY = Math.max(...positions.map(p => p.y + p.height));
    return Math.max(80, maxY + 16); // 최소 80px, 여백 16px
  }, [positions]);

  const handleRowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 예약 블록이 아닌 빈 공간 클릭 시
    if (e.target === e.currentTarget && onEmptySlotClick) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;

      // 클릭한 위치의 시간 계산
      const totalMinutes = (endHour - startHour) * 60;
      const clickedMinutes = (percentage / 100) * totalMinutes;
      const clickedHour = Math.floor(clickedMinutes / 60) + startHour;
      const clickedMinute = Math.floor((clickedMinutes % 60) / slotDuration) * slotDuration;

      const startTime = new Date();
      startTime.setHours(clickedHour, clickedMinute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + slotDuration);

      onEmptySlotClick(room, { startTime, endTime, duration: slotDuration });
    }
  };

  return (
    <div className="flex border-b border-border hover:bg-muted/30 transition-colors">
      {/* 회의실 정보 */}
      <div className="w-16 sm:w-32 flex-shrink-0 border-r border-border p-1.5 sm:p-3 bg-background">
        <div className="flex items-start gap-1 sm:gap-2">
          {/* 색상 표시 */}
          <div
            className="w-2 h-2 sm:w-3 sm:h-3 rounded-full mt-0.5 flex-shrink-0"
            style={{ backgroundColor: roomColor.base }}
          />

          <div className="flex-1 min-w-0">
            {/* 회의실 이름 */}
            <div className="font-semibold text-[10px] sm:text-sm truncate">
              {room.name}
            </div>

            {/* 수용 인원 */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Users className="w-3 h-3" />
              <span>{room.capacity}인</span>
            </div>

            {/* 위치 */}
            {room.location && (
              <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{room.location}</span>
              </div>
            )}

            {/* 모바일: 인원만 간략 표시 */}
            <div className="sm:hidden text-[9px] text-muted-foreground mt-0.5">
              {room.capacity}인
            </div>
          </div>
        </div>
      </div>

      {/* 타임라인 영역 */}
      <div
        className="flex-1 relative cursor-pointer"
        style={{ minHeight: `${rowHeight}px` }}
        onClick={handleRowClick}
      >
        {/* 시간 구분선 (1시간 단위) */}
        {Array.from({ length: endHour - startHour }).map((_, index) => {
          const position = ((index + 1) / (endHour - startHour)) * 100;

          return (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-px bg-border pointer-events-none"
              style={{ left: `${position}%` }}
            />
          );
        })}

        {/* 30분 구분선 (옅게) */}
        {slotDuration === 30 &&
          Array.from({ length: (endHour - startHour) * 2 - 1 }).map((_, index) => {
            if (index % 2 === 0) return null; // 1시간 위치는 건너뛰기

            const position = ((index + 1) * 0.5 / (endHour - startHour)) * 100;

            return (
              <div
                key={`half-${index}`}
                className="absolute top-0 bottom-0 w-px bg-border opacity-20 pointer-events-none"
                style={{ left: `${position}%` }}
              />
            );
          })}

        {/* 예약 블록들 */}
        {positions.map((pos, index) => (
          <TimelineReservationBlock
            key={pos.reservation.reservationId || index}
            reservation={pos.reservation}
            roomColor={roomColor}
            position={pos}
            onClick={() => onReservationClick?.(pos.reservation)}
          />
        ))}
      </div>
    </div>
  );
}
