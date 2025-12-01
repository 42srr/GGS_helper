import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { ClubMember } from './club-member.entity';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ name: 'leader_id' })
  leaderId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'count_member', type: 'integer', default: 0 })
  countMember: number;

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  status: string; // pending, approved, rejected

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: 'leader_id' })
  leader: User;

  @OneToMany(() => ClubMember, (clubMember) => clubMember.club)
  members: ClubMember[];
}
