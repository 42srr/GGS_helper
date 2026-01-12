import type { TimeSlot } from '@/types/calendar';

/**
 * 시간 슬롯 생성
 * @param startHour 시작 시간 (0-23)
 * @param endHour 종료 시간 (0-23)
 * @param duration 슬롯 길이 (분)
 * @param date 기준 날짜
 * @returns TimeSlot 배열
 */
export function generateTimeSlots(
  startHour: number,
  endHour: number,
  duration: number,
  date: Date = new Date()
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += duration) {
      const startTime = new Date(year, month, day, hour, minute);
      const endTime = new Date(year, month, day, hour, minute + duration);

      // 종료 시간이 endHour를 넘지 않도록
      if (endTime.getHours() > endHour ||
          (endTime.getHours() === endHour && endTime.getMinutes() > 0)) {
        break;
      }

      slots.push({
        startTime,
        endTime,
        duration,
      });
    }
  }

  return slots;
}

/**
 * 두 시간 사이의 슬롯 개수 계산
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @param slotDuration 슬롯 길이 (분)
 * @returns 슬롯 개수
 */
export function calculateSlotCount(
  startTime: Date,
  endTime: Date,
  slotDuration: number
): number {
  const diffInMs = endTime.getTime() - startTime.getTime();
  const diffInMinutes = diffInMs / (1000 * 60);
  return Math.ceil(diffInMinutes / slotDuration);
}

/**
 * 시간을 슬롯 인덱스로 변환
 * @param time 시간
 * @param startHour 시작 시간
 * @param slotDuration 슬롯 길이 (분)
 * @returns 슬롯 인덱스
 */
export function timeToSlotIndex(
  time: Date,
  startHour: number,
  slotDuration: number
): number {
  const hour = time.getHours();
  const minute = time.getMinutes();
  const totalMinutes = (hour - startHour) * 60 + minute;
  return Math.floor(totalMinutes / slotDuration);
}

/**
 * 슬롯 인덱스를 시간으로 변환
 * @param index 슬롯 인덱스
 * @param startHour 시작 시간
 * @param slotDuration 슬롯 길이 (분)
 * @param date 기준 날짜
 * @returns Date
 */
export function slotIndexToTime(
  index: number,
  startHour: number,
  slotDuration: number,
  date: Date = new Date()
): Date {
  const totalMinutes = index * slotDuration;
  const hour = Math.floor(totalMinutes / 60) + startHour;
  const minute = totalMinutes % 60;

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute
  );
}

/**
 * 현재 시간의 슬롯 내 위치 계산 (0-100%)
 * @param currentTime 현재 시간
 * @param startHour 시작 시간
 * @param endHour 종료 시간
 * @returns 위치 퍼센트 (0-100)
 */
export function getCurrentTimePosition(
  currentTime: Date,
  startHour: number,
  endHour: number
): number {
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();

  if (hour < startHour) return 0;
  if (hour >= endHour) return 100;

  const totalMinutes = (endHour - startHour) * 60;
  const currentMinutes = (hour - startHour) * 60 + minute;

  return (currentMinutes / totalMinutes) * 100;
}

/**
 * 시간 포맷 (HH:MM)
 * @param date 날짜
 * @returns 포맷된 시간 문자열
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 시간 범위 포맷 (HH:MM - HH:MM)
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @returns 포맷된 시간 범위 문자열
 */
export function formatTimeRange(startTime: Date, endTime: Date): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * 두 시간 사이의 분 차이 계산
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @returns 분 단위 차이
 */
export function getDurationInMinutes(startTime: Date, endTime: Date): number {
  const diffInMs = endTime.getTime() - startTime.getTime();
  return Math.round(diffInMs / (1000 * 60));
}

/**
 * 예약이 현재 진행 중인지 확인
 * @param startTime 예약 시작 시간
 * @param endTime 예약 종료 시간
 * @param currentTime 현재 시간 (기본값: 현재)
 * @returns 진행 중 여부
 */
export function isInProgress(
  startTime: Date,
  endTime: Date,
  currentTime: Date = new Date()
): boolean {
  return currentTime >= startTime && currentTime <= endTime;
}

/**
 * 예약이 과거인지 확인
 * @param endTime 예약 종료 시간
 * @param currentTime 현재 시간 (기본값: 현재)
 * @returns 과거 여부
 */
export function isPast(
  endTime: Date,
  currentTime: Date = new Date()
): boolean {
  return endTime < currentTime;
}

/**
 * 예약이 미래인지 확인
 * @param startTime 예약 시작 시간
 * @param currentTime 현재 시간 (기본값: 현재)
 * @returns 미래 여부
 */
export function isUpcoming(
  startTime: Date,
  currentTime: Date = new Date()
): boolean {
  return startTime > currentTime;
}
