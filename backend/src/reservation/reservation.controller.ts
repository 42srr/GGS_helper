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
} from '@nestjs/common';
import { Response } from 'express';
import { ReservationService } from './reservation.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '../auth/enums/role.enum';

@Controller('reservations')
@UseGuards(JwtAuthGuard)
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() createReservationDto: CreateReservationDto, @Req() req: any) {
    return this.reservationService.create(createReservationDto, req.user.userId);
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
  findMyReservations(@Req() req: any) {
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
    @Req() req: any,
  ) {
    return this.reservationService.update(
      +id,
      updateReservationDto,
      req.user.userId,
    );
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: any) {
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
  earlyReturn(@Param('id') id: string, @Req() req: any) {
    return this.reservationService.earlyReturn(+id, req.user.userId);
  }

  @Post(':id/check-in')
  checkIn(@Param('id') id: string, @Req() req: any) {
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
}
