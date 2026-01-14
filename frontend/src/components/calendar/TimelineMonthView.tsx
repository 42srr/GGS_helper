import { useMemo } from 'react';
import type { Room, Reservation } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth } from 'date-fns';
import { getRoomColor } from '@/utils/calendar/roomColors';
import { cn } from '@/lib/utils';

interface TimelineMonthViewProps {
  selectedDate: Date;
  rooms: Room[];
  reservations: Reservation[];
  onReservationClick?: (reservation: Reservation) => void;
}

export function TimelineMonthView({
  selectedDate,
  rooms,
  reservations,
  onReservationClick,
}: TimelineMonthViewProps) {
  // 월간 캘린더 그리드 계산 (해당 월의 모든 주 포함)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

  // 날짜별 예약 그룹화
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    reservations.forEach(reservation => {
      const dateKey = format(reservation.startTime, 'yyyy-MM-dd');
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, reservation]);
    });

    return map;
  }, [reservations]);

  const today = new Date();
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div className="overflow-auto">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-border">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={cn(
                  "p-2 text-center text-sm font-semibold border-r last:border-r-0 border-border bg-muted/50",
                  index === 0 ? "text-red-600" : "",
                  index === 6 ? "text-blue-600" : ""
                )}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div>
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0 border-border">
                {week.map((day, dayIndex) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayReservations = reservationsByDate.get(dateKey) || [];
                  const isToday = isSameDay(day, today);
                  const isCurrentMonth = isSameMonth(day, selectedDate);
                  const isSunday = dayIndex === 0;
                  const isSaturday = dayIndex === 6;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "min-h-[100px] p-2 border-r last:border-r-0 border-border",
                        !isCurrentMonth && "bg-muted/20",
                        isToday && "bg-blue-50"
                      )}
                    >
                      {/* 날짜 */}
                      <div className="flex justify-between items-start mb-1">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            !isCurrentMonth && "text-muted-foreground",
                            isToday && "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs",
                            !isToday && isSunday && "text-red-600",
                            !isToday && isSaturday && "text-blue-600"
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>

                      {/* 예약 목록 */}
                      <div className="space-y-1">
                        {dayReservations.slice(0, 3).map(reservation => {
                          const roomColor = getRoomColor(reservation.roomId);
                          const room = rooms.find(r => r.roomId === reservation.roomId);

                          return (
                            <div
                              key={reservation.reservationId}
                              className={cn(
                                "text-xs p-1 rounded cursor-pointer truncate transition-all",
                                "hover:shadow-sm",
                                roomColor.bg,
                                roomColor.text
                              )}
                              onClick={() => onReservationClick?.(reservation)}
                              title={`${reservation.title} (${room?.name})`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-semibold truncate flex-1">
                                  {reservation.title}
                                </span>
                                <span className="text-xs opacity-75 flex-shrink-0">
                                  {format(reservation.startTime, 'HH:mm')}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* 더보기 표시 */}
                        {dayReservations.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center py-1">
                            +{dayReservations.length - 3}개 더보기
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
