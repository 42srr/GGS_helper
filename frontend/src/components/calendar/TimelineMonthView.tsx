import { useMemo, useState } from 'react';
import type { Room, Reservation } from '@/types/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
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
  const [selectedDayInfo, setSelectedDayInfo] = useState<{ date: Date; reservations: Reservation[] } | null>(null);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [selectedDate]);

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

  const handleDayClick = (day: Date, dayReservations: Reservation[]) => {
    if (dayReservations.length > 0) {
      setSelectedDayInfo({ date: day, reservations: dayReservations });
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-0">
          <div className="overflow-auto">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-border">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div
                  key={day}
                  className={cn(
                    "p-1 sm:p-2 text-center text-[10px] sm:text-sm font-semibold border-r last:border-r-0 border-border bg-muted/50",
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
                    const maxVisible = 2;

                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "min-h-[60px] sm:min-h-[100px] p-1 sm:p-2 border-r last:border-r-0 border-border cursor-pointer hover:bg-muted/40 transition-colors",
                          !isCurrentMonth && "bg-muted/20",
                          isToday && "bg-blue-50"
                        )}
                        onClick={() => handleDayClick(day, dayReservations)}
                      >
                        {/* 날짜 */}
                        <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                          <span
                            className={cn(
                              "text-xs sm:text-sm font-semibold",
                              !isCurrentMonth && "text-muted-foreground",
                              isToday && "bg-blue-600 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs",
                              !isToday && isSunday && "text-red-600",
                              !isToday && isSaturday && "text-blue-600"
                            )}
                          >
                            {format(day, 'd')}
                          </span>
                        </div>

                        {/* 예약 목록 */}
                        <div className="space-y-0.5 sm:space-y-1">
                          {dayReservations.slice(0, maxVisible).map(reservation => {
                            const roomColor = getRoomColor(reservation.roomId);
                            const room = rooms.find(r => r.roomId === reservation.roomId);

                            return (
                              <div
                                key={reservation.reservationId}
                                className={cn(
                                  "text-[9px] sm:text-xs p-0.5 sm:p-1 rounded cursor-pointer truncate transition-all",
                                  "hover:shadow-sm",
                                  roomColor.bg,
                                  roomColor.text
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onReservationClick?.(reservation);
                                }}
                                title={`${reservation.title} (${room?.name})`}
                              >
                                <div className="flex items-center gap-0.5 sm:gap-1">
                                  <span className="font-semibold truncate flex-1">
                                    {reservation.title}
                                  </span>
                                  <span className="hidden sm:inline text-xs opacity-75 flex-shrink-0">
                                    {format(reservation.startTime, 'HH:mm')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {/* 더보기 표시 */}
                          {dayReservations.length > maxVisible && (
                            <div className="text-[9px] sm:text-xs text-blue-600 font-medium text-center hover:underline">
                              +{dayReservations.length - maxVisible}건 더보기
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

      {/* 일별 예약 전체 목록 모달 */}
      <Dialog open={!!selectedDayInfo} onOpenChange={(open) => !open && setSelectedDayInfo(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDayInfo && format(selectedDayInfo.date, 'yyyy년 M월 d일 (E)', { locale: ko })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {selectedDayInfo?.reservations
              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
              .map(reservation => {
                const roomColor = getRoomColor(reservation.roomId);
                const room = rooms.find(r => r.roomId === reservation.roomId);

                return (
                  <div
                    key={reservation.reservationId}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-all hover:shadow-md",
                      roomColor.bg,
                      roomColor.text
                    )}
                    onClick={() => {
                      setSelectedDayInfo(null);
                      onReservationClick?.(reservation);
                    }}
                  >
                    <div className="font-semibold text-sm">{reservation.title}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {format(reservation.startTime, 'HH:mm')} - {format(reservation.endTime, 'HH:mm')}
                    </div>
                    {room && (
                      <div className="text-xs opacity-60 mt-0.5">{room.name}</div>
                    )}
                    {reservation.user && (
                      <div className="text-xs opacity-60 mt-0.5">{reservation.user.name}</div>
                    )}
                  </div>
                );
              })}
            {selectedDayInfo?.reservations.length === 0 && (
              <p className="text-center text-muted-foreground py-4">예약이 없습니다.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
