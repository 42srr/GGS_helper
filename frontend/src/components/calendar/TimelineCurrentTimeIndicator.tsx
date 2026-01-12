import { useEffect, useState } from 'react';
import { getCurrentTimePosition } from '@/utils/calendar/timeSlots';

interface TimelineCurrentTimeIndicatorProps {
  startHour: number;
  endHour: number;
}

export function TimelineCurrentTimeIndicator({
  startHour,
  endHour,
}: TimelineCurrentTimeIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1분마다 현재 시간 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60초

    return () => clearInterval(interval);
  }, []);

  const position = getCurrentTimePosition(currentTime, startHour, endHour);

  // 표시 범위 밖이면 렌더링하지 않음
  if (position <= 0 || position >= 100) {
    return null;
  }

  return (
    <div
      className="absolute top-0 bottom-0 z-10 pointer-events-none"
      style={{ left: `${position}%` }}
    >
      {/* 빨간 세로선 */}
      <div className="absolute top-0 w-0.5 h-full bg-red-500" />

      {/* 상단 원형 마커 */}
      <div className="absolute -top-1 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-md" />

      {/* 시간 레이블 */}
      <div className="absolute -top-8 -left-8 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded shadow-lg whitespace-nowrap">
        {currentTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })}
      </div>
    </div>
  );
}
