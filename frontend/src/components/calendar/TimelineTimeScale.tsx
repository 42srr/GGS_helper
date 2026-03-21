import { useMemo } from 'react';
import { formatTime } from '@/utils/calendar/timeSlots';

interface TimelineTimeScaleProps {
  startHour: number;
  endHour: number;
  slotDuration: number;
  date?: Date;
}

export function TimelineTimeScale({
  startHour,
  endHour,
  slotDuration,
  date = new Date(),
}: TimelineTimeScaleProps) {
  // 시간 레이블 생성 (1시간 간격으로만 표시)
  const timeLabels = useMemo(() => {
    const labels: { time: Date; label: string }[] = [];

    for (let hour = startHour; hour <= endHour; hour++) {
      const time = new Date(date);
      time.setHours(hour, 0, 0, 0);

      labels.push({
        time,
        label: formatTime(time),
      });
    }

    return labels;
  }, [startHour, endHour, date]);

  const totalHours = endHour - startHour;

  return (
    <div className="flex border-b border-border bg-background sticky top-0 z-20">
      {/* 회의실 이름 칼럼 */}
      <div className="w-16 sm:w-32 flex-shrink-0 border-r border-border" />

      {/* 시간 축 */}
      <div className="flex-1 relative h-10 sm:h-12">
        {timeLabels.map((item, index) => {
          const position = ((item.time.getHours() - startHour) / totalHours) * 100;

          return (
            <div
              key={index}
              className="absolute top-0 h-full flex items-center"
              style={{ left: `${position}%` }}
            >
              {/* 시간 구분선 */}
              <div className="absolute top-0 w-px h-full bg-border" />

              {/* 시간 레이블 */}
              <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs font-medium text-muted-foreground select-none">
                {item.label}
              </span>
            </div>
          );
        })}

        {/* 30분 단위 보조선 (옅게) */}
        {slotDuration === 30 && (
          <>
            {Array.from({ length: totalHours * 2 - 1 }).map((_, index) => {
              // 30분 위치만 (1시간은 위에서 그림)
              if (index % 2 === 0) return null;

              const position = ((index + 1) * 0.5 / totalHours) * 100;

              return (
                <div
                  key={`half-${index}`}
                  className="absolute top-0 w-px h-full bg-border opacity-30"
                  style={{ left: `${position}%` }}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
