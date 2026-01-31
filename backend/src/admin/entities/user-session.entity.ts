import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;

  @Index()
  @CreateDateColumn({ name: 'login_at' })
  loginAt: Date;

  @Column({ name: 'logout_at', type: 'timestamp', nullable: true })
  logoutAt: Date | null;

  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  durationMinutes: number | null;

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}
