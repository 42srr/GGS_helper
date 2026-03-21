import type { Reservation, ReservationLayoutPosition } from '@/types/calendar';
import {
  timeToSlotIndex,
  calculateSlotCount,
} from './timeSlots';

/**
 * 예약 배치 위치 계산
 * 같은 시간대에 겹치는 예약들을 Y축으로 배치
 *
 * @param reservations 회의실의 예약 목록
 * @param startHour 타임라인 시작 시간
 * @param endHour 타임라인 종료 시간
 * @param slotDuration 슬롯 길이 (분)
 * @param rowHeight 각 예약 블록의 높이 (px)
 * @returns 배치 위치 정보 배열
 */
export function calculateReservationPositions(
  reservations: Reservation[],
  startHour: number,
  endHour: number,
  slotDuration: number,
  rowHeight: number = 60
): ReservationLayoutPosition[] {
  if (reservations.length === 0) return [];

  // 시작 시간 순으로 정렬
  const sorted = [...reservations].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const totalSlots = ((endHour - startHour) * 60) / slotDuration;
  const positions: ReservationLayoutPosition[] = [];

  // 각 예약의 배치 정보 계산
  sorted.forEach(reservation => {
    const startSlot = timeToSlotIndex(
      reservation.startTime,
      startHour,
      slotDuration
    );
    const slots = calculateSlotCount(
      reservation.startTime,
      reservation.endTime,
      slotDuration
    );

    // X 위치 (시작 슬롯 기준)
    const x = (startSlot / totalSlots) * 100;

    // 너비 (슬롯 개수 기준)
    const width = (slots / totalSlots) * 100;

    // Y 위치 (겹치는 예약 확인)
    const overlappingReservations = positions.filter(pos => {
      const posEndSlot = timeToSlotIndex(
        pos.reservation.endTime,
        startHour,
        slotDuration
      );
      return startSlot < posEndSlot && posEndSlot > startSlot;
    });

    const y = overlappingReservations.length * (rowHeight + 4); // 4px gap

    positions.push({
      reservation,
      x,
      y,
      width,
      height: rowHeight,
    });
  });

  return positions;
}

/**
 * 예약 간 충돌 감지
 * @param reservation1 예약 1
 * @param reservation2 예약 2
 * @returns 충돌 여부
 */
export function hasTimeConflict(
  reservation1: Reservation,
  reservation2: Reservation
): boolean {
  return (
    (reservation1.startTime < reservation2.endTime &&
      reservation1.endTime > reservation2.startTime) ||
    (reservation2.startTime < reservation1.endTime &&
      reservation2.endTime > reservation1.startTime)
  );
}

/**
 * 특정 시간대와 겹치는 예약 필터링
 * @param reservations 예약 목록
 * @param startTime 시작 시간
 * @param endTime 종료 시간
 * @returns 겹치는 예약 배열
 */
export function getOverlappingReservations(
  reservations: Reservation[],
  startTime: Date,
  endTime: Date
): Reservation[] {
  return reservations.filter(
    reservation =>
      reservation.startTime < endTime && reservation.endTime > startTime
  );
}

/**
 * 회의실의 가용 시간대 계산
 * @param reservations 회의실의 예약 목록
 * @param startHour 시작 시간
 * @param endHour 종료 시간
 * @param date 날짜
 * @returns 가용 시간대 배열
 */
export function calculateAvailableSlots(
  reservations: Reservation[],
  startHour: number,
  endHour: number,
  date: Date
): { startTime: Date; endTime: Date }[] {
  const availableSlots: { startTime: Date; endTime: Date }[] = [];

  // 예약을 시작 시간 순으로 정렬
  const sorted = [...reservations].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime()
  );

  const dayStart = new Date(date);
  dayStart.setHours(startHour, 0, 0, 0);

  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, 0, 0, 0);

  let currentTime = dayStart;

  sorted.forEach(reservation => {
    if (currentTime < reservation.startTime) {
      // 가용 시간대 추가
      availableSlots.push({
        startTime: new Date(currentTime),
        endTime: new Date(reservation.startTime),
      });
    }
    // 다음 확인 시작 시간 업데이트
    if (reservation.endTime > currentTime) {
      currentTime = reservation.endTime;
    }
  });

  // 마지막 예약 이후 시간
  if (currentTime < dayEnd) {
    availableSlots.push({
      startTime: new Date(currentTime),
      endTime: dayEnd,
    });
  }

  return availableSlots;
}

/**
 * 예약 블록의 최소 너비 계산 (분 → px)
 * @param durationInMinutes 예약 시간 (분)
 * @param slotDuration 슬롯 길이 (분)
 * @param slotWidth 슬롯 너비 (px)
 * @returns 블록 너비 (px)
 */
export function calculateBlockWidth(
  durationInMinutes: number,
  slotDuration: number,
  slotWidth: number
): number {
  return (durationInMinutes / slotDuration) * slotWidth;
}
