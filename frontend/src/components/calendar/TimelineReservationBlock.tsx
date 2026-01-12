import type { Reservation, RoomColor } from '@/types/calendar';
import { formatTimeRange } from '@/utils/calendar/timeSlots';
import { getStatusStyle } from '@/utils/calendar/roomColors';
import { cn } from '@/lib/utils';

interface TimelineReservationBlockProps {
  reservation: Reservation;
  roomColor: RoomColor;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  onClick?: () => void;
}

export function TimelineReservationBlock({
  reservation,
  roomColor,
  position,
  onClick,
}: TimelineReservationBlockProps) {
  const statusStyle = getStatusStyle(reservation.status);

  return (
    <div
      className={cn(
        'absolute rounded-md px-2 py-1.5 cursor-pointer overflow-hidden',
        'border-l-4 transition-all duration-200',
        'hover:shadow-lg hover:z-10 hover:scale-[1.02]',
        roomColor.bg,
        roomColor.text,
        statusStyle.className
      )}
      style={{
        left: `${position.x}%`,
        top: `${position.y}px`,
        width: `${position.width}%`,
        height: `${position.height}px`,
        borderLeftColor: roomColor.border,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.();
        }
      }}
    >
      {/* 상태 아이콘 */}
      {statusStyle.icon && (
        <span className="absolute top-1 right-1 text-xs">
          {statusStyle.icon}
        </span>
      )}

      {/* 예약 제목 */}
      <div className="text-xs font-semibold truncate pr-4">
        {reservation.title}
      </div>

      {/* 시간 정보 */}
      <div className="text-xs opacity-75 truncate">
        {formatTimeRange(reservation.startTime, reservation.endTime)}
      </div>

      {/* 사용자 정보 (공간이 충분할 때만) */}
      {position.height > 50 && reservation.user && (
        <div className="text-xs opacity-60 truncate mt-0.5">
          {reservation.user.name}
        </div>
      )}
    </div>
  );
}
