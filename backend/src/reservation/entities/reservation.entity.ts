import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Room } from '../../room/entities/room.entity';
import { User } from '../../user/entities/user.entity';

@Entity('reservation')
export class Reservation {
  @PrimaryGeneratedColumn({ name: 'reservation_id' })
  reservationId: number;

  @Column({ name: 'room_id' })
  roomId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'reservation_title' })
  title: string;

  @Column({ name: 'reservation_description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'reservation_starttime', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'reservation_endtime', type: 'timestamp' })
  endTime: Date;

  @Column({ name: 'reservation_attendees', type: 'integer', default: 0 })
  attendees: number;

  @Column({ name: 'team_name', type: 'varchar', nullable: true })
  teamName: string;

  @Column({ name: 'reservation_status', type: 'varchar', default: 'confirmed' })
  status: string;

  @Column({ name: 'is_no_show', type: 'boolean', default: false })
  isNoShow: boolean;

  @Column({ name: 'no_show_reported_at', type: 'timestamp', nullable: true })
  noShowReportedAt: Date;

  @Column({ name: 'no_show_report_count', type: 'integer', default: 0 })
  noShowReportCount: number;

  @Column({ name: 'check_in_at', type: 'timestamp', nullable: true })
  checkInAt: Date;

  @Column({ name: 'is_late', type: 'boolean', default: false })
  isLate: boolean;

  @CreateDateColumn({ name: 'reservation_createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'reservation_updatedat' })
  updatedAt: Date;

  @ManyToOne(() => Room, (room) => room.reservations)
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne(() => User, (user) => user.reservations)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
