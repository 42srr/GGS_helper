import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
} from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { CheckConflictDto } from './dto/check-conflict.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '../auth/enums/role.enum';
import { multerConfig } from '../common/multer.config';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  /**
   * 예약 생성 - 스팸 예약 방지
   * 60초에 20번까지만 허용
   */
  @Post()
  @Throttle({ default: { limit: 20, ttl: 60000 } })  // 60초에 20번
  create(@Body() createReservationDto: CreateReservationDto, @Req() req: AuthenticatedRequest) {
    return this.reservationService.create(createReservationDto, req.user.userId);
  }

  /**
   * 충돌 체크 - 빈번한 호출 가능하므로 여유있게 설정
   * 60초에 60번까지 허용
   */
  @Post('check-conflict')
  @Throttle({ default: { limit: 60, ttl: 60000 } })  // 60초에 60번
  async checkConflict(@Body() checkConflictDto: CheckConflictDto) {
    const { roomId, startDatetime, endDatetime } = checkConflictDto;
    const start = new Date(startDatetime);
    const end = new Date(endDatetime);

    const hasConflict = await this.reservationService.checkConflict(
      roomId,
      start,
      end,
    );

    return {
      hasConflict,
      message: hasConflict
        ? '해당 시간대에 이미 다른 예약이 있습니다'
        : '예약 가능한 시간입니다',
    };
  }

  @Get()
  @Public()
  findAll(
    @Query('room') roomId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (roomId) {
      return this.reservationService.findByRoom(+roomId, startDate, endDate);
    }
    return this.reservationService.findAll();
  }

  @Get('my')
  findMyReservations(@Req() req: AuthenticatedRequest) {
    return this.reservationService.findByUser(req.user.userId);
  }

  @Get('stats')
  getStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reservationService.getReservationStats(startDate, endDate);
  }

  @Get('export')
  async exportToExcel(@Res() res: Response) {
    const buffer = await this.reservationService.exportToExcel();
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=reservations_${new Date().toISOString().split('T')[0]}.xlsx`,
    });
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateReservationDto: UpdateReservationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reservationService.update(
      +id,
      updateReservationDto,
      req.user.userId,
    );
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reservationService.cancel(+id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationService.remove(+id);
  }

  @Post(':id/no-show')
  @Public()
  reportNoShow(@Param('id') id: string) {
    return this.reservationService.reportNoShow(+id);
  }

  @Post(':id/early-return')
  earlyReturn(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reservationService.earlyReturn(+id, req.user.userId);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reservationService.checkIn(+id, req.user.userId);
  }

  // 관리자 전용 엔드포인트들
  @Get('admin/all')
  @Roles(Role.ADMIN) // 관리자 권한 체크 추가
  findAllForAdmin() {
    return this.reservationService.findAllForAdmin();
  }

  @Patch('admin/:id/cancel')
  @Roles(Role.ADMIN) // 관리자 권한 체크 추가
  adminCancel(@Param('id') id: string) {
    return this.reservationService.adminCancel(+id);
  }

  @Patch('admin/:id/approve')
  @Roles(Role.ADMIN)
  approveReservation(@Param('id') id: string) {
    return this.reservationService.approveReservation(+id);
  }

  @Patch('admin/:id/reject')
  @Roles(Role.ADMIN)
  rejectReservation(@Param('id') id: string) {
    return this.reservationService.rejectReservation(+id);
  }

  @Patch('admin/:id/status')
  @Roles(Role.ADMIN)
  adminUpdateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.reservationService.adminUpdateStatus(+id, body.status);
  }

  /**
   * 체크아웃 인증 사진 업로드
   */
  @Post(':id/checkout-photo')
  @UseInterceptors(FileInterceptor('photo', multerConfig))
  async uploadCheckoutPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('notes') notes: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.reservationService.uploadCheckoutPhoto(
      id,
      file,
      req.user.userId,
      notes,
    );
  }

  /**
   * 체크아웃 사진 조회
   */
  @Get(':id/checkout-photo')
  async getCheckoutPhoto(@Param('id', ParseIntPipe) id: number) {
    return await this.reservationService.getCheckoutPhoto(id);
  }

  /**
   * 체크아웃 사진 삭제
   */
  @Delete(':id/checkout-photo')
  async deleteCheckoutPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    await this.reservationService.deleteCheckoutPhoto(id, req.user.userId);
    return {
      message: 'Checkout photo deleted successfully',
    };
  }
}
