import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum ActivityType {
  ROOM_CREATED = 'room_created',
  ROOM_UPDATED = 'room_updated',
  ROOM_DELETED = 'room_deleted',
  USER_REGISTERED = 'user_registered',
  RESERVATION_CREATED = 'reservation_created',
  RESERVATION_CANCELLED = 'reservation_cancelled',
  BACKUP_CREATED = 'backup_created',
  BACKUP_RESTORED = 'backup_restored',
  SETTINGS_UPDATED = 'settings_updated',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  EXCEL_UPLOAD = 'excel_upload',
  CLUB_APPROVED = 'club_approved',
  CLUB_REJECTED = 'club_rejected',
  CLUB_CREATED = 'club_created',
  CLUB_UPDATED = 'club_updated',
  CLUB_DELETED = 'club_deleted',
}

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: ActivityType,
  })
  type: ActivityType;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({
    type: 'enum',
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info',
  })
  level: string;

  @CreateDateColumn()
  createdAt: Date;
}
