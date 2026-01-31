import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../auth/enums/role.enum';
import * as XLSX from 'xlsx';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOne(userId: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { userId },
    });
  }

  async findByIntraId(intraId: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { intraId },
      select: ['userId', 'intraId', 'password', 'role'],
    });
  }

  async update(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    await this.userRepository.update(userId, updateUserDto);
    return await this.findOne(userId);
  }

  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, { lastLoginAt: new Date() });
  }

  async remove(userId: number): Promise<void> {
    await this.userRepository.delete(userId);
  }

  async getUserStats(userId: number): Promise<any> {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  async findAllWithReservationCount(): Promise<any[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.reservations', 'reservation')
      .select([
        'user.userId',
        'user.intraId',
        'user.role',
        'user.isAvailable',
        'user.lastLoginAt',
        'user.createdAt',
        'user.updatedAt',
        'user.noShowCount',
        'user.lastNoShowAt',
        'user.lateCount',
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
