import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reservation } from '../../reservation/entities/reservation.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId: number;

  @Column({ name: 'user_intra_id', unique: true, length: 50 })
  intraId: string;

  @Column({ name: 'user_name', length: 100 })
  name: string;

  @Column({ name: 'user_password', length: 255, select: false })
  password: string;

  @Column({ name: 'user_phone', length: 20, nullable: true })
  phone?: string;

  @Column({ name: 'user_isavailable', default: true })
  isAvailable: boolean;

  @Column({
    name: 'user_role',
    type: 'enum',
    enum: ['student', 'staff', 'admin'],
    default: 'student',
  })
  role: string;

  @CreateDateColumn({ name: 'user_createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'user_updatedat' })
  updatedAt: Date;

  @Column({ name: 'user_lastloginat', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'no_show_count', type: 'integer', default: 0 })
  noShowCount: number;

  @Column({ name: 'last_no_show_at', type: 'timestamp', nullable: true })
  lastNoShowAt: Date | null;

  @Column({ name: 'late_count', type: 'integer', default: 0 })
  lateCount: number;

  @Column({ name: 'is_reservation_banned', type: 'boolean', default: false })
  isReservationBanned: boolean;

  @Column({ name: 'ban_until', type: 'timestamp', nullable: true })
  banUntil: Date | null;

  // Relationships
  @OneToMany(() => Reservation, (reservation) => reservation.user)
  reservations: Reservation[];
}
