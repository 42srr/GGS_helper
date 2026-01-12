// 타임라인 캘린더 타입 정의

export type ViewMode = 'day' | 'week' | 'month';

export type TimeSlot = {
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
};

export type RoomColor = {
  light: string;
  base: string;
  dark: string;
  border: string;
  bg: string;
  text: string;
};

export type Room = {
  roomId: number;
  name: string;
  location: string;
  capacity: number;
  equipment?: string;
  description?: string;
  isAvailable: boolean;
};

export type Reservation = {
  reservationId: number;
  roomId: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status?: 'confirmed' | 'pending' | 'cancelled' | 'in_progress' | 'finished';
  createdAt?: Date;
  room?: Room;
  user?: {
    userId: number;
    name: string;
    email?: string;
  };
};

export type RoomWithReservations = {
  room: Room;
  reservations: Reservation[];
  availability: TimeSlot[];
};

export type TimelineConfig = {
  viewMode: ViewMode;
  startHour: number;
  endHour: number;
  slotDuration: number; // minutes
  showWeekends: boolean;
};

export type ReservationLayoutPosition = {
  reservation: Reservation;
  x: number; // left position (%)
  y: number; // top position (px)
  width: number; // width (%)
  height: number; // height (px)
};

export type TimelineViewProps = {
  rooms: Room[];
  reservations: Reservation[];
  selectedDate: Date;
  config?: Partial<TimelineConfig>;
  onReservationClick?: (reservation: Reservation) => void;
  onEmptySlotClick?: (room: Room, timeSlot: TimeSlot) => void;
};
