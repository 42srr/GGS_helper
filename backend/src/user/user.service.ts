import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Info } from './entities/info.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Api42Service } from '../api-42/api-42.service';
import { Role } from '../auth/enums/role.enum';
import * as XLSX from 'xlsx';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Info)
    private infoRepository: Repository<Info>,
    private api42Service: Api42Service,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);

    // Create corresponding info record
    const info = this.infoRepository.create({
      userId: savedUser.userId,
      studyTime: 0,
      level: 0,
      wallet: 0,
      evalPoint: 0,
      activeProject: '[]',
      coalition: '',
    });
    await this.infoRepository.save(info);

    return savedUser;
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['info'],
    });
  }

  async findOne(userId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { userId },
      relations: ['info'],
    });
  }

  async findByIntraId(intraId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { intraId },
      relations: ['info'],
    });
  }

  async update(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    await this.userRepository.update(userId, updateUserDto);
    return await this.findOne(userId);
  }

  async updateRefreshToken(userId: number, refreshToken: string): Promise<void> {
    await this.userRepository.update(userId, { refreshToken });
  }

  async clearRefreshToken(userId: number): Promise<void> {
    await this.userRepository.update(userId, { refreshToken: '' });
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async remove(userId: number): Promise<void> {
    await this.userRepository.delete(userId);
  }

  async findOrCreate(profile: any): Promise<User> {
    if (!profile || !profile.id || !profile.login) {
      throw new Error('Invalid profile data: missing required fields (id or login)');
    }

    // Convert id to string to match intraId column type
    const intraIdStr = String(profile.id);
    let user = await this.findByIntraId(intraIdStr);

    if (!user) {
      const createUserDto: CreateUserDto = {
        intraId: intraIdStr,
        name: profile.login,
        profileImgUrl: profile.image?.link || profile.image_url || '',
        grade: 'Cadet',
      };
      user = await this.create(createUserDto);
    } else {
      const updateUserDto: UpdateUserDto = {
        name: profile.login,
        profileImgUrl: profile.image?.link || profile.image_url || '',
      };
      await this.update(user.userId, updateUserDto);
      const updatedUser = await this.findOne(user.userId);
      user = updatedUser!;
    }

    await this.updateLastLogin(user.userId);
    return user;
  }

  async updateUserStatsFromApi(userId: number): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      console.error(`User not found for userId: ${userId}`);
      throw new Error('User not found');
    }

    try {
      const stats = await this.api42Service.getUserStats(
        parseInt(user.intraId),
      );

      // Update info table
      await this.infoRepository.update(
        { userId },
        {
          studyTime: stats.monthlyHours || 0,
          level: stats.level || 0,
          wallet: stats.wallet || 0,
          evalPoint: stats.evaluationPoints || 0,
          activeProject: JSON.stringify(stats.activeProjects || []),
          coalition:
            stats.coalitions && stats.coalitions.length > 0
              ? stats.coalitions[0].name
              : '',
          lastUpdateedAt: new Date(),
        },
      );

      // Update user grade
      if (stats.grade) {
        await this.userRepository.update(userId, { grade: stats.grade });
      }

      const updatedUser = await this.findOne(userId);
      if (!updatedUser) {
        console.error('User not found after update');
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error) {
      console.error(
        `Failed to update user stats for user ${userId}:`,
        error.message,
      );
      console.error('Error stack:', error.stack);
      throw error;
    }
  }

  async getUserStats(userId: number): Promise<any> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if data needs update (older than 1 hour or missing)
    const shouldUpdate =
      !user.info?.lastUpdateedAt ||
      new Date().getTime() - user.info.lastUpdateedAt.getTime() >
        60 * 60 * 1000;

    if (shouldUpdate) {
      try {
        return await this.updateUserStatsFromApi(userId);
      } catch (error) {
        console.log('Failed to update user stats from 42 API, returning cached data:', error.message);
        // Return cached data if API update fails
        return user;
      }
    }

    return user;
  }

  async refreshUserStats(userId: number): Promise<User> {
    try {
      return await this.updateUserStatsFromApi(userId);
    } catch (error) {
      console.log('Failed to refresh user stats from 42 API:', error.message);
      // Return current user data if API update fails
      const user = await this.findOne(userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }
  }

  async getApiStats(userId: number): Promise<any> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return await this.api42Service.getUserStats(parseInt(user.intraId));
  }

  async findAllWithReservationCount(): Promise<any[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.reservations', 'reservation')
      .leftJoin('user.info', 'info')
      .select([
        'user.userId',
        'user.intraId',
        'user.name',
        'user.profileImgUrl',
        'user.role',
        'user.isAvailable',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
        'user.grade',
        'user.noShowCount',
        'user.lastNoShowAt',
        'user.isReservationBanned',
        'user.banUntil',
      ])
      .addSelect('COUNT(reservation.reservationId)', 'reservationCount')
      .groupBy('user.userId')
      .orderBy('user.createdAt', 'DESC')
      .getRawAndEntities();

    return users.entities.map((user, index) => ({
      ...user,
      _count: {
        reservations: parseInt(users.raw[index].reservationCount) || 0,
      },
    }));
  }

  async updateUser(userId: number, updateData: any): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, updateData);
    return await this.userRepository.save(user);
  }

  async exportToExcel(): Promise<Buffer> {
    const users = await this.findAllWithReservationCount();

    const data = users.map((user) => ({
      ID: user.userId,
      '인트라 ID': user.intraId,
      이름: user.name || '',
      등급: user.grade || '',
      역할: user.role || '',
      '예약 수': user._count?.reservations || 0,
      '활성 상태': user.isAvailable ? '활성' : '비활성',
      '최종 로그인': user.lastLoginAt || '',
      가입일: user.createdAt,
      수정일: user.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '사용자 목록');

    const maxWidths: number[] = data.reduce((widths: number[], row) => {
      Object.keys(row).forEach((key, i) => {
        const value = row[key]?.toString() || '';
        widths[i] = Math.max(widths[i] || 10, value.length);
      });
      return widths;
    }, [] as number[]);

    worksheet['!cols'] = maxWidths.map((w) => ({ width: Math.min(w + 2, 50) }));

    return Buffer.from(
      XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
    );
  }

  async updateUserRole(userId: number, role: Role): Promise<User> {
    await this.userRepository.update(userId, { role });
    const updatedUser = await this.findOne(userId);
    if (!updatedUser) {
      throw new Error('User not found');
    }
    return updatedUser;
  }

  async getUsersByRole(role: Role): Promise<User[]> {
    return await this.userRepository.find({
      where: { role },
      relations: ['info'],
    });
  }

}
