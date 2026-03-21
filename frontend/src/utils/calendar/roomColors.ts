import type { RoomColor } from '@/types/calendar';

// 회의실별 테마 색상
const ROOM_COLOR_PALETTE: RoomColor[] = [
  {
    light: '#DBEAFE',
    base: '#3B82F6',
    dark: '#1E3A8A',
    border: '#60A5FA',
    bg: 'bg-blue-100',
    text: 'text-blue-900',
  },
  {
    light: '#E9D5FF',
    base: '#A855F7',
    dark: '#581C87',
    border: '#C084FC',
    bg: 'bg-purple-100',
    text: 'text-purple-900',
  },
  {
    light: '#D1FAE5',
    base: '#10B981',
    dark: '#064E3B',
    border: '#34D399',
    bg: 'bg-green-100',
    text: 'text-green-900',
  },
  {
    light: '#FED7AA',
    base: '#F97316',
    dark: '#7C2D12',
    border: '#FB923C',
    bg: 'bg-orange-100',
    text: 'text-orange-900',
  },
  {
    light: '#FCE7F3',
    base: '#EC4899',
    dark: '#831843',
    border: '#F472B6',
    bg: 'bg-pink-100',
    text: 'text-pink-900',
  },
  {
    light: '#E0E7FF',
    base: '#6366F1',
    dark: '#312E81',
    border: '#818CF8',
    bg: 'bg-indigo-100',
    text: 'text-indigo-900',
  },
  {
    light: '#FEF3C7',
    base: '#F59E0B',
    dark: '#78350F',
    border: '#FBBF24',
    bg: 'bg-amber-100',
    text: 'text-amber-900',
  },
  {
    light: '#CCFBF1',
    base: '#14B8A6',
    dark: '#134E4A',
    border: '#2DD4BF',
    bg: 'bg-teal-100',
    text: 'text-teal-900',
  },
];

/**
 * 회의실 ID로 색상 가져오기
 * @param roomId 회의실 ID
 * @returns 회의실 색상 객체
 */
export function getRoomColor(roomId: number): RoomColor {
  const index = (roomId - 1) % ROOM_COLOR_PALETTE.length;
  return ROOM_COLOR_PALETTE[index];
}

/**
 * 모든 회의실 색상 매핑 가져오기
 * @param roomIds 회의실 ID 배열
 * @returns Map<roomId, RoomColor>
 */
export function getRoomColorMap(roomIds: number[]): Map<number, RoomColor> {
  const colorMap = new Map<number, RoomColor>();
  roomIds.forEach(id => {
    colorMap.set(id, getRoomColor(id));
  });
  return colorMap;
}

/**
 * 예약 상태별 스타일 가져오기
 */
export function getStatusStyle(status: string | undefined) {
  switch (status) {
    case 'confirmed':
      return {
        opacity: '100%',
        icon: '✓',
        label: '확정',
        className: 'opacity-100',
      };
    case 'pending':
      return {
        opacity: '60%',
        icon: '⏳',
        label: '승인 대기',
        className: 'opacity-60 border-dashed',
      };
    case 'in_progress':
      return {
        opacity: '100%',
        icon: '▶',
        label: '진행 중',
        className: 'opacity-100 ring-2 ring-offset-1',
      };
    case 'cancelled':
      return {
        opacity: '30%',
        icon: '✗',
        label: '취소됨',
        className: 'opacity-30 line-through',
      };
    default:
      return {
        opacity: '100%',
        icon: '',
        label: '',
        className: '',
      };
  }
}
