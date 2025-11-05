export type RoomStatus = 'available' | 'occupied' | 'maintenance';
export type ReservationStatus = 'confirmed' | 'pending' | 'cancelled';

export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  description?: string;
}

export interface Reservation {
  id: string;
  roomId: string;
  roomName: string;
  userId: string;
  userName: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  status: ReservationStatus;
  createdAt: Date;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  room: string;
  user: string;
  status: ReservationStatus;
}