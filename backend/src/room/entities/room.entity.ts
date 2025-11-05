import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Reservation } from '../../reservation/entities/reservation.entity';

@Entity('room')
export class Room {
  @PrimaryGeneratedColumn({ name: 'room_id' })
  roomId: number;

  @Column({ name: 'room_name' })
  name: string;

  @Column({ name: 'room_description', type: 'text', nullable: true })
  description: string;

  @Column({ name: 'room_location', nullable: true })
  location: string;

  @Column({ name: 'room_capacity', type: 'integer', nullable: true })
  capacity: number;

  @Column({ name: 'room_equipment', type: 'text', nullable: true })
  equipment: string;

  @Column({ name: 'room_isavailable', default: true })
  isAvailable: boolean;

  @Column({ name: 'room_is_confirm', default: true })
  isConfirm: boolean;

  @CreateDateColumn({ name: 'room_createdat' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'room_updatedat' })
  updatedAt: Date;

  @OneToMany(() => Reservation, (reservation) => reservation.room)
  reservations: Reservation[];
}
