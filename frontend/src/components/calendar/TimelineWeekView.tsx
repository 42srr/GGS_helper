import { useMemo } from 'react';
import type { Room, Reservation } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getRoomColor } from '@/utils/calendar/roomColors';
import { cn } from '@/lib/utils';

interface TimelineWeekViewProps {
  selectedDate: Date;
  rooms: Room[];
  reservations: Reservation[];
  startHour: number;
  endHour: number;
  onReservationClick?: (reservation: Reservation) => void;
}

export function TimelineWeekView({
  selectedDate,
  rooms,
  reservations,
  startHour,
  endHour,
  onReservationClick,
}: TimelineWeekViewProps) {
  // 주의 시작일과 종료일 계산
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [selectedDate]);

  // 시간 슬롯 생성 (1시간 단위)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(hour);
    }
    return slots;
  }, [startHour, endHour]);

  // 특정 날짜와 시간대의 예약 찾기
  const getReservationsForSlot = (date: Date, hour: number) => {
    return reservations.filter(reservation => {
      if (!isSameDay(reservation.startTime, date)) return false;

      const resStartHour = reservation.startTime.getHours();
      const resEndHour = reservation.endTime.getHours();
      const resEndMinute = reservation.endTime.getMinutes();

      // 해당 시간대에 예약이 걸쳐있는지 확인
      return resStartHour <= hour && (resEndHour > hour || (resEndHour === hour && resEndMinute > 0));
    });
  };

  const today = new Date();

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="overflow-auto">
          <table className="w-full border-collapse" style={{ minWidth: '500px' }}>
            <thead>
              <tr>
                <th className="border border-border bg-gray-100 p-1 sm:p-2 w-12 sm:w-24 sticky left-0 z-10 text-xs sm:text-sm">
                  시간
                </th>
                {weekDays.map(day => {
                  const isToday = isSameDay(day, today);
                  return (
                    <th
                      key={day.toISOString()}
                      className={cn(
                        "border border-border p-1 sm:p-2",
                        isToday ? "bg-blue-50" : "bg-muted/50"
                      )}
                    >
                      <div className="text-center">
                        <div className={cn(
                          "text-[10px] sm:text-xs font-medium",
                          isToday ? "text-blue-600" : "text-muted-foreground"
                        )}>
                          {format(day, 'E', { locale: ko })}
                        </div>
                        <div className={cn(
                          "text-xs sm:text-sm font-bold",
                          isToday ? "text-blue-600" : ""
                        )}>
                          {format(day, 'M/d')}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(hour => (
                <tr key={hour}>
                  <td className="border border-border bg-gray-50 p-1 sm:p-2 text-center font-medium text-[10px] sm:text-sm sticky left-0 z-10">
                    {`${hour.toString().padStart(2, '0')}:00`}
                  </td>
                  {weekDays.map(day => {
                    const slotReservations = getReservationsForSlot(day, hour);
                    const isToday = isSameDay(day, today);

                    return (
                      <td
                        key={`${day.toISOString()}-${hour}`}
                        className={cn(
                          "border border-border p-0.5 sm:p-1 align-top",
                          isToday ? "bg-blue-50/30" : "bg-background"
                        )}
                        style={{ minHeight: '48px' }}
                      >
                        <div className="space-y-0.5 sm:space-y-1">
                          {slotReservations.map(reservation => {
                            const roomColor = getRoomColor(reservation.roomId);
                            const room = rooms.find(r => r.roomId === reservation.roomId);

                            return (
                              <div
                                key={reservation.reservationId}
                                className={cn(
                                  "text-[10px] sm:text-xs p-1 sm:p-1.5 rounded cursor-pointer transition-all",
                                  "hover:shadow-md hover:scale-[1.02]",
                                  roomColor.bg,
                                  roomColor.text
                                )}
                                onClick={() => onReservationClick?.(reservation)}
                              >
                                <div className="font-semibold truncate">
                                  {reservation.title}
                                </div>
                                <div className="hidden sm:block text-xs opacity-75 truncate">
                                  {format(reservation.startTime, 'HH:mm')} - {format(reservation.endTime, 'HH:mm')}
                                </div>
                                {room && (
                                  <div className="hidden sm:block text-xs opacity-60 truncate">
                                    {room.name}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
