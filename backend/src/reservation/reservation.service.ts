import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan, LessThan, IsNull } from 'typeorm';
import { Reservation } from './entities/reservation.entity';
import { Room } from '../room/entities/room.entity';
import { User } from '../user/entities/user.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as XLSX from 'xlsx';

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 매 시간마다 예약 시간이 지난 confirmed 예약을 finished로 변경
  @Cron(CronExpression.EVERY_HOUR)
  async updateFinishedReservations() {
    const now = new Date();

    const result = await this.reservationRepository
      .createQueryBuilder()
      .update(Reservation)
      .set({ status: 'finished' })
      .where('reservation_endtime < :now', { now })
      .andWhere('reservation_status = :status', { status: 'confirmed' })
      .execute();

    if (result.affected && result.affected > 0) {
      console.log(`Updated ${result.affected} reservations to finished status`);
    }
  }

  // 5분마다 체크인 안된 예약 중 시작+30분 지난 것을 노쇼 처리
  @Cron('*/5 * * * *')
  async handleAutoNoShow() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    // 시작 시간이 30분 이상 지났는데 체크인 안된 confirmed 예약
    const expiredReservations = await this.reservationRepository.find({
      where: {
        status: 'confirmed',
        startTime: LessThan(thirtyMinutesAgo),
        checkInAt: IsNull(),
        isNoShow: false, // 이미 노쇼 처리된 것 제외
      },
      relations: ['user'],
    });

    if (expiredReservations.length > 0) {
      console.log(`Found ${expiredReservations.length} reservations to mark as no-show`);

      for (const reservation of expiredReservations) {
        await this.markAsNoShow(reservation);
      }
    }
  }

  // 노쇼 처리 메서드 (user 테이블 업데이트 포함)
  private async markAsNoShow(reservation: Reservation): Promise<void> {
    const now = new Date();

    // 예약을 노쇼로 표시
    reservation.isNoShow = true;
    reservation.noShowReportedAt = now;
    reservation.status = 'cancelled';
    await this.reservationRepository.save(reservation);

    // 사용자의 노쇼 카운트 증가
    const user = await this.userRepository.findOne({
      where: { userId: reservation.userId },
    });

    if (user) {
      user.noShowCount += 1;
      user.lastNoShowAt = now;

      // 노쇼 발생시 즉시 7일간 예약 금지
      user.isReservationBanned = true;
      const banUntil = new Date(now);
      banUntil.setDate(banUntil.getDate() + 7); // 7일 후
      user.banUntil = banUntil;

      // 노쇼 3회 이상이면 영구 예약 금지 (관리자 면담 필요)
      if (user.noShowCount >= 3) {
        user.banUntil = null; // 영구 금지 (해제일 없음)
      }

      await this.userRepository.save(user);
      console.log(`User ${user.userId} no-show count: ${user.noShowCount}, banned until: ${user.banUntil || 'permanent'}`);
    }
  }

  async create(
    createReservationDto: CreateReservationDto,
    userId: number,
  ): Promise<Reservation> {
    const { roomId, title, description, startTime, endTime, attendees } =
      createReservationDto;

    // 사용자의 예약 금지 상태 확인
    const user = await this.userRepository.findOne({
      where: { userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    if (user.isReservationBanned) {
      const now = new Date();

      // 영구 금지인 경우 (banUntil이 null)
      if (!user.banUntil) {
        throw new BadRequestException(
          `노쇼 3회 누적으로 예약이 영구 제한되었습니다. 관리자에게 문의하여 면담을 진행해주세요.`
        );
      }

      // 예약 금지 기간이 지났는지 확인
      if (user.banUntil > now) {
        const banUntilKST = new Date(user.banUntil.getTime() + 9 * 60 * 60 * 1000);
        throw new BadRequestException(
          `예약이 제한되었습니다. 해제일: ${banUntilKST.toISOString().split('T')[0]}`
        );
      } else {
        // 금지 기간이 지났으면 해제
        user.isReservationBanned = false;
        user.banUntil = null;
        await this.userRepository.save(user);
      }
    }

    // 시간 유효성 검사
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('시작 시간은 종료 시간보다 빨라야 합니다');
    }

    if (start < new Date()) {
      throw new BadRequestException('과거 시간으로는 예약할 수 없습니다');
    }

    // 예약 시간 제한 (최대 2시간)
    const durationInMs = end.getTime() - start.getTime();
    const durationInHours = durationInMs / (1000 * 60 * 60);
    if (durationInHours > 2) {
      throw new BadRequestException('1회 예약은 최대 2시간까지만 가능합니다');
    }

    // 중복 예약 확인 (DB 레벨에서 최적화된 쿼리)
    const hasConflict = await this.checkTimeConflict(roomId, start, end);
    if (hasConflict) {
      throw new BadRequestException('해당 시간대에 이미 다른 예약이 있습니다');
    }

    // 회의실 정보 조회
    const room = await this.roomRepository.findOne({ where: { roomId } });
    if (!room) {
      throw new NotFoundException('회의실을 찾을 수 없습니다');
    }

    // 회의실 isConfirm에 따라 예약 상태 결정
    const status = room.isConfirm ? 'pending' : 'confirmed';

    const reservation = this.reservationRepository.create({
      roomId,
      userId,
      title,
      description,
      startTime: start,
      endTime: end,
      attendees,
      status,
    });

    return await this.reservationRepository.save(reservation);
  }

  // 시간 충돌 검사 헬퍼 메서드 (DB 레벨에서 최적화)
  private async checkTimeConflict(
    roomId: number,
    start: Date,
    end: Date,
    excludeId?: number,
  ): Promise<boolean> {
    const query = this.reservationRepository
      .createQueryBuilder('reservation')
      .where('reservation.room_id = :roomId', { roomId })
      .andWhere('reservation.reservation_starttime < :end', { end })
      .andWhere('reservation.reservation_endtime > :start', { start });

    if (excludeId) {
      query.andWhere('reservation.reservation_id != :excludeId', {
        excludeId,
      });
    }

    const count = await query.getCount();
    return count > 0;
  }

  async findAll(): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      relations: ['room', 'user'],
      order: { startTime: 'ASC' },
    });
  }

  async findByUser(userId: number): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      where: { userId },
      relations: ['room'],
      order: { startTime: 'DESC' },
    });
  }

  async findByRoom(
    roomId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<Reservation[]> {
    const whereCondition: any = {
      roomId,
    };

    if (startDate && endDate) {
      whereCondition.startTime = Between(
        new Date(startDate),
        new Date(endDate),
      );
    } else {
      // 기본적으로 현재 시간 이후의 예약만 조회
      whereCondition.startTime = MoreThan(new Date());
    }

    return await this.reservationRepository.find({
      where: whereCondition,
      relations: ['user'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(reservationId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['room', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException(
        `Reservation with ID ${reservationId} not found`,
      );
    }

    return reservation;
  }

  async update(
    reservationId: number,
    updateReservationDto: UpdateReservationDto,
    userId: number,
  ): Promise<Reservation> {
    const reservation = await this.findOne(reservationId);

    // 본인 예약만 수정 가능 (관리자 권한은 추후 추가)
    if (reservation.userId !== userId) {
      throw new BadRequestException('본인의 예약만 수정할 수 있습니다');
    }

    // 이미 시작된 예약은 상태 변경만 가능
    const isOnlyStatusUpdate =
      Object.keys(updateReservationDto).length === 1 &&
      'status' in updateReservationDto;

    if (reservation.startTime < new Date() && !isOnlyStatusUpdate) {
      throw new BadRequestException('이미 시작된 예약은 수정할 수 없습니다');
    }

    // 시간 변경 시 중복 확인
    if (updateReservationDto.startTime || updateReservationDto.endTime) {
      const newStartTime = updateReservationDto.startTime
        ? new Date(updateReservationDto.startTime)
        : reservation.startTime;
      const newEndTime = updateReservationDto.endTime
        ? new Date(updateReservationDto.endTime)
        : reservation.endTime;

      if (newStartTime >= newEndTime) {
        throw new BadRequestException(
          '시작 시간은 종료 시간보다 빨라야 합니다',
        );
      }

      // 예약 시간 제한 (최대 2시간)
      const durationInMs = newEndTime.getTime() - newStartTime.getTime();
      const durationInHours = durationInMs / (1000 * 60 * 60);
      if (durationInHours > 2) {
        throw new BadRequestException('1회 예약은 최대 2시간까지만 가능합니다');
      }

      // 다른 예약과의 충돌 확인 (본인 예약 제외, 최적화된 쿼리 사용)
      const hasConflict = await this.checkTimeConflict(
        reservation.roomId,
        newStartTime,
        newEndTime,
        reservationId, // 본인 예약 제외
      );

      if (hasConflict) {
        throw new BadRequestException(
          '해당 시간대에 이미 다른 예약이 있습니다',
        );
      }

      updateReservationDto.startTime = newStartTime.toISOString();
      updateReservationDto.endTime = newEndTime.toISOString();
    }

    Object.assign(reservation, updateReservationDto);
    return await this.reservationRepository.save(reservation);
  }

  async cancel(reservationId: number, userId: number): Promise<void> {
    const reservation = await this.findOne(reservationId);

    // 본인 예약만 취소 가능 (관리자 권한은 추후 추가)
    if (reservation.userId !== userId) {
      throw new BadRequestException('본인의 예약만 취소할 수 있습니다');
    }

    // 이미 시작된 예약은 취소 불가
    if (reservation.startTime < new Date()) {
      throw new BadRequestException('이미 시작된 예약은 취소할 수 없습니다');
    }

    // status 필드 제거됨 - 예약 삭제로 처리
    await this.reservationRepository.remove(reservation);
  }

  async remove(reservationId: number): Promise<void> {
    const reservation = await this.findOne(reservationId);
    await this.reservationRepository.remove(reservation);
  }

  // 관리자용: 모든 예약 조회
  async findAllForAdmin(): Promise<Reservation[]> {
    return await this.reservationRepository.find({
      relations: ['room', 'user'],
      order: { createdAt: 'DESC' },
    });
  }

  // 관리자용: 예약 강제 취소 (삭제로 변경)
  async adminCancel(reservationId: number): Promise<void> {
    const reservation = await this.findOne(reservationId);
    await this.reservationRepository.remove(reservation);
  }

  // 통계: 날짜별 예약 현황
  async getReservationStats(startDate: string, endDate: string) {
    const reservations = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoin('reservation.room', 'room')
      .select([
        'DATE(reservation.reservation_starttime) as date',
        'COUNT(*) as total_reservations',
        'COUNT(DISTINCT reservation.room_id) as rooms_used',
        'SUM(reservation.reservation_attendees) as total_attendees',
      ])
      .where(
        'reservation.reservation_starttime BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      )
      .groupBy('DATE(reservation.reservation_starttime)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return reservations;
  }

  // 조기 반납
  async earlyReturn(
    reservationId: number,
    userId: number,
  ): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['room', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다');
    }

    // 본인 예약인지 확인
    if (reservation.userId !== userId) {
      throw new BadRequestException('본인의 예약만 조기 반납할 수 있습니다');
    }

    // 노쇼 상태인 경우 조기 반납 불가
    if (reservation.isNoShow) {
      throw new BadRequestException('노쇼 처리된 예약은 조기 반납할 수 없습니다');
    }

    // 취소된 예약은 조기 반납 불가
    if (reservation.status === 'cancelled') {
      throw new BadRequestException('취소된 예약은 조기 반납할 수 없습니다');
    }

    // 체크인을 하지 않았으면 조기 반납 불가
    if (!reservation.checkInAt) {
      throw new BadRequestException('체크인 후에만 조기 반납이 가능합니다');
    }

    const now = new Date();

    // 예약 시작 시간이 지났는지 확인
    if (reservation.startTime > now) {
      throw new BadRequestException('예약 시작 시간 이후에만 조기 반납이 가능합니다');
    }

    // 예약 종료 시간이 지나지 않았는지 확인
    if (reservation.endTime <= now) {
      throw new BadRequestException('이미 종료된 예약입니다');
    }

    // 예약 종료 시간을 현재 시간으로 변경하고 상태를 finished로 변경
    reservation.endTime = now;
    reservation.status = 'finished';

    return await this.reservationRepository.save(reservation);
  }

  async reportNoShow(reservationId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['room', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다');
    }

    // 예약 시작 시간이 지났는지 확인
    const now = new Date();
    if (reservation.startTime > now) {
      throw new BadRequestException('예약 시작 시간 이후에만 노쇼 신고가 가능합니다');
    }

    // 이미 노쇼 처리된 경우
    if (reservation.isNoShow) {
      throw new BadRequestException('이미 노쇼 처리된 예약입니다');
    }

    // 노쇼 처리
    await this.markAsNoShow(reservation);

    return reservation;
  }

  // 체크인 처리
  async checkIn(reservationId: number, userId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['room', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다');
    }

    // 본인 예약인지 확인
    if (reservation.userId !== userId) {
      throw new BadRequestException('본인의 예약만 체크인할 수 있습니다');
    }

    // 예약 상태 확인
    if (reservation.status !== 'confirmed') {
      throw new BadRequestException('승인된 예약만 체크인할 수 있습니다');
    }

    // 이미 체크인된 경우
    if (reservation.checkInAt) {
      throw new BadRequestException('이미 체크인된 예약입니다');
    }

    // 노쇼 상태면 체크인 불가
    if (reservation.isNoShow) {
      throw new BadRequestException('노쇼 처리된 예약은 체크인할 수 없습니다');
    }

    const now = new Date();

    // 예약 시작 시간 확인 (시작 시간 10분 전부터 체크인 가능)
    const tenMinutesBeforeStart = new Date(reservation.startTime.getTime() - 10 * 60 * 1000);
    if (now < tenMinutesBeforeStart) {
      throw new BadRequestException('예약 시작 10분 전부터 체크인이 가능합니다');
    }

    // 예약 시작 시간 + 30분 이후에는 체크인 불가 (노쇼 처리됨)
    const thirtyMinutesAfterStart = new Date(reservation.startTime.getTime() + 30 * 60 * 1000);
    if (now > thirtyMinutesAfterStart) {
      throw new BadRequestException('체크인 가능 시간이 지났습니다 (시작 시간 후 30분까지만 가능)');
    }

    // 체크인 처리
    reservation.checkInAt = now;

    // 지각 여부 판단 (시작 후 10분 ~ 30분 사이)
    const tenMinutesAfterStart = new Date(reservation.startTime.getTime() + 10 * 60 * 1000);
    if (now > tenMinutesAfterStart) {
      reservation.isLate = true;

      // 사용자의 지각 카운트 증가
      const user = await this.userRepository.findOne({
        where: { userId: reservation.userId },
      });

      if (user) {
        user.lateCount += 1;
        console.log(`User ${user.userId} late count: ${user.lateCount}`);

        // 지각 3회시 노쇼 카운트 1회 추가 및 즉시 7일간 예약 금지
        if (user.lateCount >= 3) {
          user.noShowCount += 1;
          user.lateCount = 0; // 지각 카운트 초기화
          console.log(`User ${user.userId} reached 3 lates. No-show count increased to: ${user.noShowCount}`);

          // 즉시 7일간 예약 금지
          user.isReservationBanned = true;
          const banUntil = new Date(now);
          banUntil.setDate(banUntil.getDate() + 7); // 7일 후
          user.banUntil = banUntil;

          // 노쇼 3회 이상이면 영구 예약 금지 (관리자 면담 필요)
          if (user.noShowCount >= 3) {
            user.banUntil = null; // 영구 금지 (해제일 없음)
          }

          console.log(`User ${user.userId} banned until ${user.banUntil || 'permanent'}`);
        }

        await this.userRepository.save(user);
      }
    }

    return await this.reservationRepository.save(reservation);
  }

  // 관리자: 예약 상태 변경
  async adminUpdateStatus(
    reservationId: number,
    status: string,
  ): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['room', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다');
    }

    reservation.status = status;
    return await this.reservationRepository.save(reservation);
  }

  // 관리자: 예약 승인
  async approveReservation(reservationId: number): Promise<Reservation> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
      relations: ['room', 'user'],
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다');
    }

    if (reservation.status === 'confirmed') {
      throw new BadRequestException('이미 승인된 예약입니다');
    }

    reservation.status = 'confirmed';
    return await this.reservationRepository.save(reservation);
  }

  // 관리자: 예약 거절
  async rejectReservation(reservationId: number): Promise<void> {
    const reservation = await this.reservationRepository.findOne({
      where: { reservationId },
    });

    if (!reservation) {
      throw new NotFoundException('예약을 찾을 수 없습니다');
    }

    // 거절된 예약은 삭제 처리
    await this.reservationRepository.remove(reservation);
  }

  // Excel 내보내기
  async exportToExcel(): Promise<Buffer> {
    const reservations = await this.reservationRepository.find({
      relations: ['room', 'user'],
      order: { startTime: 'DESC' },
    });

    const data = reservations.map((reservation) => ({
      ID: reservation.reservationId,
      '예약 제목': reservation.title,
      설명: reservation.description || '',
      회의실: reservation.room?.name || '',
      '회의실 위치': reservation.room?.location || '',
      예약자: reservation.user?.name || '',
      '시작 시간': reservation.startTime,
      '종료 시간': reservation.endTime,
      '참석 인원': reservation.attendees || 0,
      생성일: reservation.createdAt,
      수정일: reservation.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '예약 목록');

    // 열 너비 설정
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
}
