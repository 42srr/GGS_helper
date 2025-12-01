import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Club } from './entities/club.entity';
import { ClubMember, ClubMemberRole, ClubMemberStatus } from './entities/club-member.entity';
import { User } from '../user/entities/user.entity';
import { CreateClubDto } from './dto/create-club.dto';
import { UpdateClubDto } from './dto/update-club.dto';
import { JoinClubDto } from './dto/join-club.dto';
import { UpdateMemberStatusDto } from './dto/update-member-status.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { AdminService } from '../admin/admin.service';
import { ActivityType } from '../admin/entities/activity-log.entity';

@Injectable()
export class ClubService {
  constructor(
    @InjectRepository(Club)
    private clubRepository: Repository<Club>,
    @InjectRepository(ClubMember)
    private clubMemberRepository: Repository<ClubMember>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @Inject(forwardRef(() => AdminService))
    private adminService: AdminService,
  ) {}

  // 동아리 생성
  async createClub(createClubDto: CreateClubDto): Promise<Club> {
    const { name, leaderId, description } = createClubDto;

    // 동아리명 중복 체크
    const existingClub = await this.clubRepository.findOne({ where: { name } });
    if (existingClub) {
      throw new ConflictException('이미 존재하는 동아리명입니다');
    }

    // 리더 확인
    const leader = await this.userRepository.findOne({ where: { userId: leaderId } });
    if (!leader) {
      throw new NotFoundException('리더로 지정된 사용자를 찾을 수 없습니다');
    }

    // 동아리 생성 (pending 상태로)
    const club = this.clubRepository.create({
      name,
      leaderId,
      description,
      countMember: 1,
      status: 'pending', // 관리자 승인 대기
    });
    const savedClub = await this.clubRepository.save(club);

    // 리더를 동아리 멤버로 자동 추가
    const leaderMember = this.clubMemberRepository.create({
      clubId: savedClub.id,
      userId: leaderId,
      role: ClubMemberRole.LEADER,
      status: ClubMemberStatus.ACTIVE,
    });
    await this.clubMemberRepository.save(leaderMember);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.CLUB_CREATED,
        '새 동아리 생성 신청',
        `'${savedClub.name}' 동아리 생성이 신청되었습니다 (승인 대기)`,
        leaderId,
        {
          clubId: savedClub.id,
          clubName: savedClub.name,
          leaderId,
          status: 'pending',
        },
        'info',
      );
    } catch (error) {
      console.error('Failed to log club creation activity:', error);
    }

    return savedClub;
  }

  // 동아리 정보 수정
  async updateClub(clubId: number, updateClubDto: UpdateClubDto): Promise<Club> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    // 동아리명 변경 시 중복 체크
    if (updateClubDto.name && updateClubDto.name !== club.name) {
      const existingClub = await this.clubRepository.findOne({
        where: { name: updateClubDto.name },
      });
      if (existingClub) {
        throw new ConflictException('이미 존재하는 동아리명입니다');
      }
    }

    // 리더 변경 시 확인
    if (updateClubDto.leaderId && updateClubDto.leaderId !== club.leaderId) {
      const newLeader = await this.userRepository.findOne({
        where: { userId: updateClubDto.leaderId },
      });
      if (!newLeader) {
        throw new NotFoundException('새 리더로 지정된 사용자를 찾을 수 없습니다');
      }

      // 기존 리더의 역할 변경
      const oldLeaderMember = await this.clubMemberRepository.findOne({
        where: { clubId, userId: club.leaderId },
      });
      if (oldLeaderMember) {
        oldLeaderMember.role = ClubMemberRole.MEMBER;
        await this.clubMemberRepository.save(oldLeaderMember);
      }

      // 새 리더의 역할 변경
      let newLeaderMember = await this.clubMemberRepository.findOne({
        where: { clubId, userId: updateClubDto.leaderId },
      });
      if (!newLeaderMember) {
        // 새 리더가 멤버가 아니면 추가
        newLeaderMember = this.clubMemberRepository.create({
          clubId,
          userId: updateClubDto.leaderId,
          role: ClubMemberRole.LEADER,
          status: ClubMemberStatus.ACTIVE,
        });
        await this.clubMemberRepository.save(newLeaderMember);
        club.countMember += 1;
      } else {
        newLeaderMember.role = ClubMemberRole.LEADER;
        await this.clubMemberRepository.save(newLeaderMember);
      }
    }

    Object.assign(club, updateClubDto);
    const updatedClub = await this.clubRepository.save(club);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.CLUB_UPDATED,
        '동아리 정보 수정됨',
        `'${updatedClub.name}' 동아리 정보가 수정되었습니다`,
        undefined,
        {
          clubId: updatedClub.id,
          clubName: updatedClub.name,
          changes: updateClubDto,
        },
        'info',
      );
    } catch (error) {
      console.error('Failed to log club update activity:', error);
    }

    return updatedClub;
  }

  // 동아리 회원 가입
  async joinClub(joinClubDto: JoinClubDto): Promise<ClubMember> {
    const { clubId, userId } = joinClubDto;

    // 동아리 확인
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    // 사용자 확인
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 이미 가입된 회원인지 확인
    const existingMember = await this.clubMemberRepository.findOne({
      where: { clubId, userId },
    });
    if (existingMember) {
      throw new ConflictException('이미 동아리에 가입된 회원입니다');
    }

    // 회원 추가
    const member = this.clubMemberRepository.create({
      clubId,
      userId,
      role: ClubMemberRole.MEMBER,
      status: ClubMemberStatus.ACTIVE,
    });
    const savedMember = await this.clubMemberRepository.save(member);

    // 동아리 회원 수 업데이트
    club.countMember += 1;
    await this.clubRepository.save(club);

    return savedMember;
  }

  // 동아리 멤버 조회
  async getClubMembers(clubId: number): Promise<ClubMember[]> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    return await this.clubMemberRepository.find({
      where: { clubId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  // 동아리 멤버 상태 변경
  async updateMemberStatus(
    clubId: number,
    userId: number,
    updateStatusDto: UpdateMemberStatusDto,
  ): Promise<ClubMember> {
    const member = await this.clubMemberRepository.findOne({
      where: { clubId, userId },
      relations: ['user', 'club'],
    });

    if (!member) {
      throw new NotFoundException('동아리 멤버를 찾을 수 없습니다');
    }

    member.status = updateStatusDto.status;
    return await this.clubMemberRepository.save(member);
  }

  // 동아리 멤버 역할 변경
  async updateMemberRole(
    clubId: number,
    userId: number,
    updateRoleDto: UpdateMemberRoleDto,
  ): Promise<ClubMember> {
    const member = await this.clubMemberRepository.findOne({
      where: { clubId, userId },
      relations: ['user', 'club'],
    });

    if (!member) {
      throw new NotFoundException('동아리 멤버를 찾을 수 없습니다');
    }

    // 리더로 변경하는 경우 기존 리더의 역할을 변경
    if (updateRoleDto.role === ClubMemberRole.LEADER) {
      const currentLeader = await this.clubMemberRepository.findOne({
        where: { clubId, role: ClubMemberRole.LEADER },
      });

      if (currentLeader && currentLeader.id !== member.id) {
        currentLeader.role = ClubMemberRole.MEMBER;
        await this.clubMemberRepository.save(currentLeader);

        // 동아리의 leaderId도 업데이트
        const club = await this.clubRepository.findOne({ where: { id: clubId } });
        if (club) {
          club.leaderId = userId;
          await this.clubRepository.save(club);
        }
      }
    }

    member.role = updateRoleDto.role;
    return await this.clubMemberRepository.save(member);
  }

  // 동아리 목록 조회
  async findAll(): Promise<Club[]> {
    return await this.clubRepository.find({
      relations: ['leader'],
      order: { name: 'ASC' },
    });
  }

  // 동아리 상세 조회
  async findOne(clubId: number): Promise<Club> {
    const club = await this.clubRepository.findOne({
      where: { id: clubId },
      relations: ['leader', 'members', 'members.user'],
    });

    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    return club;
  }

  // 동아리 삭제
  async remove(clubId: number): Promise<void> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    // 멤버 먼저 삭제
    await this.clubMemberRepository.delete({ clubId });

    // 동아리 삭제
    await this.clubRepository.remove(club);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.CLUB_DELETED,
        '동아리 삭제됨',
        `'${club.name}' 동아리가 삭제되었습니다`,
        undefined,
        {
          clubId: club.id,
          clubName: club.name,
        },
        'warning',
      );
    } catch (error) {
      console.error('Failed to log club deletion activity:', error);
    }
  }

  // 동아리 승인 (관리자)
  async approveClub(clubId: number): Promise<Club> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    club.status = 'approved';
    const updatedClub = await this.clubRepository.save(club);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.CLUB_APPROVED,
        '동아리 승인됨',
        `'${club.name}' 동아리가 승인되었습니다`,
        undefined,
        {
          clubId: club.id,
          clubName: club.name,
          leaderId: club.leaderId,
        },
        'success',
      );
    } catch (error) {
      console.error('Failed to log club approval activity:', error);
    }

    return updatedClub;
  }

  // 동아리 거부 (관리자)
  async rejectClub(clubId: number): Promise<Club> {
    const club = await this.clubRepository.findOne({ where: { id: clubId } });
    if (!club) {
      throw new NotFoundException('동아리를 찾을 수 없습니다');
    }

    club.status = 'rejected';
    const updatedClub = await this.clubRepository.save(club);

    // 활동 로그 기록
    try {
      await this.adminService.logActivity(
        ActivityType.CLUB_REJECTED,
        '동아리 거부됨',
        `'${club.name}' 동아리가 거부되었습니다`,
        undefined,
        {
          clubId: club.id,
          clubName: club.name,
          leaderId: club.leaderId,
        },
        'warning',
      );
    } catch (error) {
      console.error('Failed to log club rejection activity:', error);
    }

    return updatedClub;
  }

  // 승인 대기 중인 동아리 목록 조회 (관리자)
  async findPendingClubs(): Promise<Club[]> {
    return await this.clubRepository.find({
      where: { status: 'pending' },
      relations: ['leader'],
      order: { createdAt: 'DESC' },
    });
  }
}
