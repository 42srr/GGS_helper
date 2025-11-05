import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface Reservation {
  reservationId: number;
  roomId: number;
  roomName?: string;
  userId: number;
  userName?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status?: 'confirmed' | 'pending' | 'cancelled';
  createdAt?: Date;
}

interface CalendarProps {
  reservations: Reservation[];
  onEventClick?: (reservation: Reservation) => void;
}

export function Calendar({ reservations, onEventClick }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<{ date: number; reservations: Reservation[] } | null>(null);

  const today = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    '1월', '2월', '3월', '4월', '5월', '6월',
    '7월', '8월', '9월', '10월', '11월', '12월'
  ];

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getReservationsForDate = (date: number) => {
    const targetDate = new Date(year, month, date);
    return reservations.filter(reservation => {
      const reservationDate = new Date(reservation.startTime);
      return (
        reservationDate.getFullYear() === targetDate.getFullYear() &&
        reservationDate.getMonth() === targetDate.getMonth() &&
        reservationDate.getDate() === targetDate.getDate()
      );
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleShowMore = (date: number, dayReservations: Reservation[]) => {
    setSelectedDate({ date, reservations: dayReservations });
  };

  const handleCloseModal = () => {
    setSelectedDate(null);
  };

  // 달력 그리드를 위한 빈 셀들과 날짜들 생성
  const calendarDays = [];

  // 이전 달의 빈 셀들
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-20 sm:h-32"></div>);
  }

  // 현재 달의 날짜들
  for (let date = 1; date <= daysInMonth; date++) {
    const dayReservations = getReservationsForDate(date);
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === date;

    calendarDays.push(
      <div
        key={date}
        className={`h-20 sm:h-32 border border-gray-200 p-0.5 sm:p-1 overflow-hidden ${
          isToday ? 'bg-blue-50' : ''
        }`}
      >
        <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
          isToday ? 'text-blue-600' : 'text-gray-700'
        }`}>
          {date}
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          {dayReservations.slice(0, 1).map((reservation) => (
            <div
              key={reservation.reservationId}
              onClick={() => onEventClick?.(reservation)}
              className={`text-[10px] sm:text-xs p-0.5 sm:p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getStatusColor(reservation.status)}`}
            >
              <div className="font-medium truncate">{reservation.title}</div>
              <div className="hidden sm:flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(reservation.startTime)}
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {reservation.roomName}
              </div>
            </div>
          ))}
          {dayReservations.length > 1 && (
            <button
              onClick={() => handleShowMore(date, dayReservations)}
              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 font-medium px-0.5 sm:px-1 w-full text-left hover:underline"
            >
              +{dayReservations.length - 1}개 더보기
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        {/* 캘린더 헤더 */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
            {year}년 {monthNames[month]}
          </h2>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {dayNames.map((day, index) => (
            <div
              key={day}
              className={`p-1 sm:p-3 text-center text-xs sm:text-sm font-medium ${
                index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
          {calendarDays}
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-2 sm:gap-4 mt-4 text-xs sm:text-sm flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>확정</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>대기</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>취소</span>
          </div>
        </div>
      </CardContent>

      {/* 날짜별 전체 예약 모달 */}
      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && handleCloseModal()}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {year}년 {month + 1}월 {selectedDate?.date}일 예약 목록
            </DialogTitle>
            <DialogDescription>
              총 {selectedDate?.reservations.length}개의 예약이 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            {selectedDate?.reservations.map((reservation) => (
              <div
                key={reservation.reservationId}
                onClick={() => {
                  onEventClick?.(reservation);
                  handleCloseModal();
                }}
                className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(reservation.status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{reservation.title}</h3>
                    {reservation.description && (
                      <p className="text-sm opacity-80 mb-2">{reservation.description}</p>
                    )}
                  </div>
                  <div className="text-xs font-medium px-2 py-1 rounded">
                    {reservation.status === 'confirmed' && '확정'}
                    {reservation.status === 'pending' && '대기'}
                    {reservation.status === 'cancelled' && '취소'}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}</span>
                  </div>
                  {reservation.roomName && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{reservation.roomName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}