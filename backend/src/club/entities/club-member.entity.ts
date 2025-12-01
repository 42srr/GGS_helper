import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Club } from './club.entity';
import { User } from '../../user/entities/user.entity';

export enum ClubMemberRole {
  MEMBER = 'member',
  LEADER = 'leader',
  STAFF = 'staff',
}

export enum ClubMemberStatus {
  FREEZE = 'freeze',
  ACTIVE = 'active',
  WORK = 'work',
  INACTIVE = 'inactive',
}

@Entity('club_members')
@Unique(['clubId', 'userId'])
export class ClubMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'club_id' })
  clubId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: ClubMemberRole,
    default: ClubMemberRole.MEMBER,
  })
  role: ClubMemberRole;

  @Column({
    type: 'enum',
    enum: ClubMemberStatus,
    default: ClubMemberStatus.ACTIVE,
  })
  status: ClubMemberStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Club, (club) => club.members)
  @JoinColumn({ name: 'club_id' })
  club: Club;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
