import type { ViewMode } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { addDays, format, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

interface TimelineHeaderProps {
  viewMode: ViewMode;
  selectedDate: Date;
  onViewModeChange: (mode: ViewMode) => void;
  onDateChange: (date: Date) => void;
}

export function TimelineHeader({
  viewMode,
  selectedDate,
  onViewModeChange,
  onDateChange,
}: TimelineHeaderProps) {
  const goToPrevious = () => {
    if (viewMode === 'week') {
      onDateChange(addDays(selectedDate, -7));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      onDateChange(newDate);
    }
  };

  const goToNext = () => {
    if (viewMode === 'week') {
      onDateChange(addDays(selectedDate, 7));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() + 1);
      onDateChange(newDate);
    }
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const formatDateTitle = () => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { locale: ko });
      const weekEnd = endOfWeek(selectedDate, { locale: ko });
      return `${format(weekStart, 'M월 d일', { locale: ko })} - ${format(weekEnd, 'M월 d일', { locale: ko })}`;
    } else {
      return format(selectedDate, 'yyyy년 M월', { locale: ko });
    }
  };

  const formatDateTitleShort = () => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { locale: ko });
      const weekEnd = endOfWeek(selectedDate, { locale: ko });
      return `${format(weekStart, 'M/d', { locale: ko })} - ${format(weekEnd, 'M/d', { locale: ko })}`;
    } else {
      return format(selectedDate, 'yyyy.M월', { locale: ko });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border-b bg-background">
      {/* 상단: 날짜 네비게이션 */}
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            aria-label="이전"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={goToToday}
            className="h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            오늘
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            aria-label="다음"
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-sm sm:text-xl font-bold">
          <span className="hidden sm:inline">{formatDateTitle()}</span>
          <span className="sm:hidden">{formatDateTitleShort()}</span>
        </h2>
      </div>

      {/* 하단: 뷰 모드 전환 */}
      <div className="flex gap-1 sm:gap-2">
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('week')}
          className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
        >
          주간
        </Button>
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('month')}
          className="flex-1 sm:flex-none h-8 text-xs sm:text-sm"
        >
          월간
        </Button>
      </div>
    </div>
  );
}
