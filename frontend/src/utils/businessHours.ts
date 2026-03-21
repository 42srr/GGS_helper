/**
 * 업무시간 설정
 */
export const BUSINESS_HOURS = {
  START: 9,  // 09:00
  END: 18,   // 18:00
  DAYS: [1, 2, 3, 4, 5], // 월-금 (0: 일요일, 1: 월요일, ..., 6: 토요일)
} as const;

/**
 * 주어진 날짜/시간이 업무시간인지 확인
 * @param date - 확인할 날짜 (Date 객체 또는 ISO 문자열)
 * @returns true: 업무시간, false: 업무시간 외
 */
export function isBusinessHours(date: Date | string): boolean {
  const targetDate = typeof date === 'string' ? new Date(date) : date;

  const day = targetDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
  const hour = targetDate.getHours();

  // 주말 체크 (월-금만 업무시간)
  if (!BUSINESS_HOURS.DAYS.includes(day as 1 | 2 | 3 | 4 | 5)) {
    return false;
  }

  // 시간 체크 (09:00 ~ 17:59까지가 업무시간)
  if (hour < BUSINESS_HOURS.START || hour >= BUSINESS_HOURS.END) {
    return false;
  }

  return true;
}

/**
 * 현재 시각이 업무시간인지 확인
 * @returns true: 현재 업무시간, false: 현재 업무시간 외
 */
export function isCurrentlyBusinessHours(): boolean {
  return isBusinessHours(new Date());
}

/**
 * 예약 신청 시각이 업무시간 외인지 확인
 * (예약 시작 시간이 아닌, 지금 예약을 신청하는 시각 기준)
 * @returns true: 업무시간 외 신청, false: 업무시간 내 신청
 */
export function isAfterHoursReservation(): boolean {
  return !isCurrentlyBusinessHours();
}
