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
    if (viewMode === 'day') {
      onDateChange(addDays(selectedDate, -1));
    } else if (viewMode === 'week') {
      onDateChange(addDays(selectedDate, -7));
    } else {
      const newDate = new Date(selectedDate);
      newDate.setMonth(newDate.getMonth() - 1);
      onDateChange(newDate);
    }
  };

  const goToNext = () => {
    if (viewMode === 'day') {
      onDateChange(addDays(selectedDate, 1));
    } else if (viewMode === 'week') {
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
    if (viewMode === 'day') {
      return format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko });
    } else if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { locale: ko });
      const weekEnd = endOfWeek(selectedDate, { locale: ko });
      return `${format(weekStart, 'M월 d일', { locale: ko })} - ${format(weekEnd, 'M월 d일', { locale: ko })}`;
    } else {
      return format(selectedDate, 'yyyy년 M월', { locale: ko });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      {/* 좌측: 날짜 네비게이션 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPrevious}
            aria-label="이전"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            onClick={goToToday}
            className="min-w-[80px]"
          >
            <Calendar className="h-4 w-4 mr-2" />
            오늘
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNext}
            aria-label="다음"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <h2 className="text-xl font-bold">
          {formatDateTitle()}
        </h2>
      </div>

      {/* 우측: 뷰 모드 전환 */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'day' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('day')}
        >
          일간
        </Button>
        <Button
          variant={viewMode === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('week')}
        >
          주간
        </Button>
        <Button
          variant={viewMode === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onViewModeChange('month')}
        >
          월간
        </Button>
      </div>
    </div>
  );
}
