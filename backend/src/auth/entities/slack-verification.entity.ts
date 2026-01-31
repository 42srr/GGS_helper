import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('slack_verifications')
export class SlackVerification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'intra_id', length: 50 })
  intraId: string;

  @Column({ name: 'verification_code', length: 6 })
  verificationCode: string;

  @Column({ name: 'slack_user_id', nullable: true })
  slackUserId?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;
}
