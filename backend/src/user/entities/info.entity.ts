import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('info')
export class Info {
  @PrimaryGeneratedColumn({ name: 'info_id' })
  infoId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    name: 'info_studytime',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  studyTime: number;

  @Column({
    name: 'info_level',
    type: 'decimal',
    precision: 8,
    scale: 2,
    default: 0,
  })
  level: number;

  @Column({ name: 'info_wallet', type: 'integer', default: 0 })
  wallet: number;

  @Column({ name: 'info_evalpoint', type: 'integer', default: 0 })
  evalPoint: number;

  @Column({ name: 'info_activeproject', type: 'text', default: '[]' })
  activeProject: string;

  @Column({ name: 'info_coalition', type: 'varchar', default: '' })
  coalition: string;

  @Column({ name: 'info_lastupdateedat', nullable: true })
  lastUpdateedAt: Date;

  // Relationships
  @OneToOne(() => User, (user) => user.info)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
